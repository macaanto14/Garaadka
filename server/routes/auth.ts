import express from 'express';
import { db } from '../index';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { auditMiddleware, addAuditFieldsForInsert, addAuditFieldsForUpdate, AuditableRequest } from '../middleware/auditMiddleware';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, verifyToken } from '../middleware/auth';

const router = express.Router();

// Apply audit middleware to routes that need it
router.use('/register', auditMiddleware);
router.use('/update-profile', auditMiddleware);

// Get user profile (protected route)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user from database
    const [users] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM `user accounts` WHERE `PERSONAL ID` = ? AND deleted_at IS NULL',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const { PASSWORD, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get fresh user data
    const [users] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM `user accounts` WHERE `PERSONAL ID` = ? AND deleted_at IS NULL',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    
    // Generate new token
    const token = generateToken(user);
    
    const { PASSWORD, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      token: token
    });

  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route (with audit logging)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get user from database
    const [users] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM `user accounts` WHERE USERNAME = ?',
      [username]
    );

    if (users.length === 0) {
      // Log failed login attempt
      await db.execute(
        'INSERT INTO audit (emp_id, date, status, action_type, table_name) VALUES (?, ?, ?, ?, ?)',
        [username, new Date().toISOString().slice(0, 19).replace('T', ' '), 
         'Failed Login - User Not Found', 'LOGIN', 'user accounts']
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password using utility function
    const isValidPassword = await comparePassword(password, user.PASSWORD);

    if (!isValidPassword) {
      // Log failed login attempt
      await db.execute(
        'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id) VALUES (?, ?, ?, ?, ?, ?)',
        [username, new Date().toISOString().slice(0, 19).replace('T', ' '), 
         'Failed Login - Invalid Password', 'LOGIN', 'user accounts', user['PERSONAL ID']]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Log successful login
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, new Date().toISOString().slice(0, 19).replace('T', ' '), 
       'User Login', 'LOGIN', 'user accounts', user['PERSONAL ID']]
    );

    // Return user data (excluding password) with JWT token
    const { PASSWORD, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword,
      token: token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new user with audit logging
// Registration endpoint
router.post('/register', async (req: AuditableRequest, res) => {
  try {
    console.log('Registration request body:', req.body);
    
    const { 
      personal_id, 
      fname, 
      username, 
      password,
      city,
      phone_no,
      position,
      sec_que,
      answer
    } = req.body;

    if (!personal_id || !fname || !username || !password) {
      return res.status(400).json({ error: 'Personal ID, name, username, and password are required' });
    }

    // Improved validation for personal_id
    const personalIdNumber = parseInt(personal_id);
    if (isNaN(personalIdNumber) || personalIdNumber <= 0) {
      return res.status(400).json({ error: 'Personal ID must be a valid positive number' });
    }

    // Check if user already exists
    const [existingUsers] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM `user accounts` WHERE USERNAME = ? OR `PERSONAL ID` = ?',
      [username, personal_id.toString()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password using utility function
    const hashedPassword = await hashPassword(password);

    // Ensure auditUser is not undefined
    const auditUser = req.auditUser || 'system';
    
    // Create timestamp
    const currentTimestamp = new Date();
    
    // Prepare user data with all fields including optional ones
    const userData = {
      personal_id: personal_id.toString(),
      fname: fname,
      username: username,
      password: hashedPassword,
      city: city || null,
      phone_no: phone_no || null,
      position: position || null,
      sec_que: sec_que || null,
      answer: answer || null,
      status: 'active',
      created_at: currentTimestamp,
      updated_at: currentTimestamp,
      created_by: auditUser,
      updated_by: auditUser
    };

    // Debug log to see what we're sending
    console.log('Complete user data being inserted:', {
      ...userData,
      password: '[HIDDEN]'
    });

    // Create user with all required fields - COMPLETE INSERT STATEMENT
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO \`user accounts\` 
       (\`PERSONAL ID\`, fname, USERNAME, PASSWORD, CITY, PHONENO, POSITION, sec_que, answer, status, created_at, updated_at, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.personal_id,
        userData.fname,
        userData.username,
        userData.password,
        userData.city,
        userData.phone_no,
        userData.position,
        userData.sec_que,
        userData.answer,
        userData.status,
        userData.created_at,
        userData.updated_at,
        userData.created_by,
        userData.updated_by
      ]
    );

    console.log('User created successfully with ID:', result.insertId);

    // Log to audit table
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        auditUser, 
        new Date().toISOString().slice(0, 19).replace('T', ' '), 
        'Created User Account', 
        'CREATE', 
        'user accounts', 
        userData.personal_id, 
        JSON.stringify({...userData, password: '[HIDDEN]'})
      ]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user_id: userData.personal_id
    });

  } catch (error) {
    console.error('Error during registration:', error);
    
    // Type-safe error handling
    const errorDetails: any = {};
    if (error instanceof Error) {
      errorDetails.message = error.message;
    }
    if (typeof error === 'object' && error !== null) {
      const dbError = error as any;
      if (dbError.code) errorDetails.code = dbError.code;
      if (dbError.errno) errorDetails.errno = dbError.errno;
      if (dbError.sql) errorDetails.sql = dbError.sql;
      if (dbError.sqlState) errorDetails.sqlState = dbError.sqlState;
      if (dbError.sqlMessage) errorDetails.sqlMessage = dbError.sqlMessage;
    }
    
    console.error('Error details:', errorDetails);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile with audit logging
router.put('/update-profile/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { fname, city, phone_no, position } = req.body;

    // Get old values for audit
    const [oldUser] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM `user accounts` WHERE `PERSONAL ID` = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (oldUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Convert undefined values to null for database compatibility
    const updateData = addAuditFieldsForUpdate({
      fname: fname || null,
      city: city || null,
      phone_no: phone_no || null,
      position: position || null
    }, req.auditUser || 'system');

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE \`user accounts\` SET 
       fname = ?, CITY = ?, PHONENO = ?, POSITION = ?, updated_at = ?, updated_by = ?
       WHERE \`PERSONAL ID\` = ? AND deleted_at IS NULL`,
      [updateData.fname, updateData.city, updateData.phone_no, updateData.position, 
       updateData.updated_at, updateData.updated_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log to audit table
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.auditUser || 'system', new Date().toISOString().slice(0, 19).replace('T', ' '), 
       'Updated User Profile', 'UPDATE', 'user accounts', id, JSON.stringify(oldUser[0]), JSON.stringify(updateData)]
    );

    res.json({ success: true, message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password with audit logging
// Change password with audit logging
router.put('/change-password/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get user
    const [users] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM `user accounts` WHERE `PERSONAL ID` = ? AND deleted_at IS NULL',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify current password using utility function
    const isValidPassword = await comparePassword(currentPassword, user.PASSWORD);

    if (!isValidPassword) {
      // Log failed password change attempt - ensure auditUser is not undefined
      const auditUser = req.auditUser || 'system';
      await db.execute(
        'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id) VALUES (?, ?, ?, ?, ?, ?)',
        [auditUser, new Date().toISOString().slice(0, 19).replace('T', ' '), 
         'Failed Password Change - Invalid Current Password', 'UPDATE', 'user accounts', id]
      );
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password using utility function
    const hashedNewPassword = await hashPassword(newPassword);

    const updateData = addAuditFieldsForUpdate({
      password: hashedNewPassword
    }, req.auditUser || 'system');

    // Update password
    await db.execute(
      'UPDATE `user accounts` SET PASSWORD = ?, updated_at = ?, updated_by = ? WHERE `PERSONAL ID` = ?',
      [hashedNewPassword, updateData.updated_at, updateData.updated_by, id]
    );

    // Log successful password change - ensure auditUser is not undefined
    const auditUser = req.auditUser || 'system';
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id) VALUES (?, ?, ?, ?, ?, ?)',
      [auditUser, new Date().toISOString().slice(0, 19).replace('T', ' '), 
       'Password Changed Successfully', 'UPDATE', 'user accounts', id]
    );

    res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout with audit logging
router.post('/logout', async (req, res) => {
  try {
    const { username } = req.body;

    if (username) {
      // Log logout
      await db.execute(
        'INSERT INTO audit (emp_id, date, status, action_type, table_name) VALUES (?, ?, ?, ?, ?)',
        [username, new Date().toISOString().slice(0, 19).replace('T', ' '), 
         'User Logout', 'LOGOUT', 'user accounts']
      );
    }

    res.json({ success: true, message: 'Logged out successfully' });

  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
