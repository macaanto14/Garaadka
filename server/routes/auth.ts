import express from 'express';
import { db } from '../index';
import { RowDataPacket } from 'mysql2';
import { generateToken, verifyToken } from '../middleware/auth';
import { comparePassword, hashPassword } from '../utils/password';

const router = express.Router();

// Login endpoint with JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query the user accounts table
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM `user accounts` WHERE USERNAME = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Check password (support both hashed and plain text for migration)
    let isValidPassword = false;

    if (user.PASSWORD.startsWith('$2a$') || user.PASSWORD.startsWith('$2b$')) {
      // Password is already hashed
      isValidPassword = await comparePassword(password, user.PASSWORD);
    } else {
      // Plain text password (for backward compatibility)
      isValidPassword = password === user.PASSWORD;
      
      // If login is successful with plain text, hash and update the password
      if (isValidPassword) {
        try {
          const hashedPassword = await hashPassword(password);
          await db.execute(
            'UPDATE `user accounts` SET PASSWORD = ? WHERE `PERSONAL ID` = ?',
            [hashedPassword, user['PERSONAL ID']]
          );
        } catch (updateError) {
          console.error('Failed to update password hash:', updateError);
          // Continue with login even if password update fails
          // This allows the user to login while you fix the database schema
        }
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Log the login activity in audit table
    await db.execute(
      'INSERT INTO audit (emp_id, date, status) VALUES (?, ?, ?)',
      [user.USERNAME, new Date().toLocaleString(), 'User Login']
    );

    // Return user data (excluding password) and token
    const { PASSWORD, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword,
      token,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get fresh user data
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM `user accounts` WHERE `PERSONAL ID` = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = rows[0];
    const newToken = generateToken(user);

    const { PASSWORD, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword,
      token: newToken,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (optional - for audit logging)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    if (req.user) {
      // Log the logout activity in audit table
      await db.execute(
        'INSERT INTO audit (emp_id, date, status) VALUES (?, ?, ?)',
        [req.user.username, new Date().toLocaleString(), 'User Logout']
      );
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile (protected route)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT `PERSONAL ID`, fname, USERNAME, CITY, PHONENO, POSITION, IMAGE FROM `user accounts` WHERE `PERSONAL ID` = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password endpoint
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get current user data
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT PASSWORD FROM `user accounts` WHERE `PERSONAL ID` = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    // Verify current password
    let isValidPassword = false;
    if (user.PASSWORD.startsWith('$2a$') || user.PASSWORD.startsWith('$2b$')) {
      isValidPassword = await comparePassword(currentPassword, user.PASSWORD);
    } else {
      isValidPassword = currentPassword === user.PASSWORD;
    }

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await db.execute(
      'UPDATE `user accounts` SET PASSWORD = ? WHERE `PERSONAL ID` = ?',
      [hashedNewPassword, req.user.id]
    );

    // Log the password change
    await db.execute(
      'INSERT INTO audit (emp_id, date, status) VALUES (?, ?, ?)',
      [req.user.username, new Date().toLocaleString(), 'Password Changed']
    );

    res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to check users (for debugging)
router.get('/test-users', async (req, res) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT `PERSONAL ID`, fname, USERNAME, POSITION FROM `user accounts`'
    );
    
    console.log('All users in database:', rows);
    res.json({ users: rows, count: rows.length });
  } catch (error) {
    console.error('Test users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;