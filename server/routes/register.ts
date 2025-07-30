import express from 'express';
import { db } from '../index';
import { auditMiddleware, addAuditFieldsForInsert, addAuditFieldsForUpdate, addAuditFieldsForDelete, AuditableRequest } from '../middleware/auditMiddleware';

const router = express.Router();

// Apply audit middleware to all routes
router.use(auditMiddleware);

// GET search register records by phone number
router.get('/search/:phone', async (req: AuditableRequest, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone || phone.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Phone number must be at least 3 characters long',
        example: '+252 61 234 5678'
      });
    }

    // Clean phone number for search (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    const query = `
      SELECT 
        r.id,
        r.name,
        r.customer_name,
        r.phone,
        r.email,
        r.laundry_items,
        r.drop_off_date,
        r.pickup_date,
        r.delivery_status,
        r.total_amount,
        r.paid_amount,
        (r.total_amount - IFNULL(r.paid_amount, 0)) AS balance,
        r.payment_status,
        r.notes,
        r.receipt_number,
        r.status,
        r.created_at,
        r.updated_at,
        r.created_by,
        r.updated_by
      FROM register r
      WHERE (
        REPLACE(REPLACE(REPLACE(r.phone, ' ', ''), '-', ''), '(', '') LIKE ? OR
        REPLACE(REPLACE(REPLACE(r.phone, ' ', ''), '-', ''), ')', '') LIKE ?
      )
      AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC
    `;
    
    const searchPattern = `%${cleanPhone}%`;
    const [records] = await db.execute(query, [searchPattern, searchPattern]);
    
    if (Array.isArray(records) && records.length === 0) {
      return res.status(404).json({ 
        error: 'No records found for this phone number',
        phone_searched: phone
      });
    }
    
    res.json({
      records,
      total_found: Array.isArray(records) ? records.length : 0,
      phone_searched: phone
    });
  } catch (error) {
    console.error('Error searching register by phone:', error);
    res.status(500).json({ error: 'Failed to search register records' });
  }
});

// GET all register records with pagination and filtering
router.get('/', async (req: AuditableRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE r.deleted_at IS NULL';
    const queryParams: any[] = [];

    if (status && ['pending', 'ready', 'delivered', 'cancelled'].includes(status)) {
      whereClause += ' AND r.delivery_status = ?';
      queryParams.push(status);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM register r ${whereClause}`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const totalRecords = (countResult as any)[0].total;

    // Get paginated records
    const query = `
      SELECT 
        r.id,
        r.name,
        r.customer_name,
        r.phone,
        r.email,
        r.laundry_items,
        r.drop_off_date,
        r.pickup_date,
        r.delivery_status,
        r.total_amount,
        r.paid_amount,
        (r.total_amount - IFNULL(r.paid_amount, 0)) AS balance,
        r.payment_status,
        r.notes,
        r.receipt_number,
        r.status,
        r.created_at,
        r.updated_at,
        r.created_by,
        r.updated_by
      FROM register r
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(limit, offset);
    const [records] = await db.execute(query, queryParams);
    
    res.json({
      records,
      pagination: {
        current_page: page,
        per_page: limit,
        total: totalRecords,
        total_pages: Math.ceil(totalRecords / limit),
        has_next: page < Math.ceil(totalRecords / limit),
        has_prev: page > 1
      },
      filters: {
        status: status || 'all'
      }
    });
  } catch (error) {
    console.error('Error fetching register records:', error);
    res.status(500).json({ error: 'Failed to fetch register records' });
  }
});

// GET register record by ID
router.get('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        r.id,
        r.name,
        r.customer_name,
        r.phone,
        r.email,
        r.laundry_items,
        r.drop_off_date,
        r.pickup_date,
        r.delivery_status,
        r.total_amount,
        r.paid_amount,
        (r.total_amount - IFNULL(r.paid_amount, 0)) AS balance,
        r.payment_status,
        r.notes,
        r.receipt_number,
        r.status,
        r.created_at,
        r.updated_at,
        r.created_by,
        r.updated_by
      FROM register r
      WHERE r.id = ? AND r.deleted_at IS NULL
    `;
    
    const [records] = await db.execute(query, [id]);
    
    if (Array.isArray(records) && records.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }
    
    res.json(records[0]);
  } catch (error) {
    console.error('Error fetching register record:', error);
    res.status(500).json({ error: 'Failed to fetch register record' });
  }
});

// PUT update delivery status
router.put('/:id/status', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { delivery_status, notes } = req.body;
    
    // Validate delivery status
    if (!delivery_status || !['pending', 'ready', 'delivered', 'cancelled'].includes(delivery_status)) {
      return res.status(400).json({ 
        error: 'Invalid delivery status',
        valid_statuses: ['pending', 'ready', 'delivered', 'cancelled']
      });
    }

    // Check if record exists
    const [existingRecord] = await db.execute(
      'SELECT id, delivery_status FROM register WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (Array.isArray(existingRecord) && existingRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Prepare update data with audit fields
    const updateData = addAuditFieldsForUpdate({
      delivery_status,
      notes: notes || null,
      pickup_date: delivery_status === 'delivered' ? new Date() : null
    }, req.user);

    const query = `
      UPDATE register 
      SET delivery_status = ?, notes = ?, pickup_date = ?, updated_at = ?, updated_by = ?
      WHERE id = ? AND deleted_at IS NULL
    `;
    
    await db.execute(query, [
      updateData.delivery_status,
      updateData.notes,
      updateData.pickup_date,
      updateData.updated_at,
      updateData.updated_by,
      id
    ]);

    // Fetch updated record
    const [updatedRecord] = await db.execute(
      `SELECT 
        r.id,
        r.name,
        r.customer_name,
        r.phone,
        r.delivery_status,
        r.notes,
        r.pickup_date,
        r.updated_at,
        r.updated_by
      FROM register r
      WHERE r.id = ? AND r.deleted_at IS NULL`,
      [id]
    );

    res.json({
      message: `Delivery status updated to ${delivery_status}`,
      record: updatedRecord[0]
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

// POST create new register entry
router.post('/', async (req: AuditableRequest, res) => {
  try {
    const { 
      name, 
      customer_name, 
      phone, 
      email, 
      laundry_items, 
      drop_off_date,
      total_amount,
      paid_amount,
      payment_status,
      notes 
    } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ 
        error: 'Name and phone number are required',
        required_fields: ['name', 'phone']
      });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format',
        example: '+252 61 234 5678'
      });
    }

    // Check for duplicate phone number
    const [existingRecord] = await db.execute(
      'SELECT id, name FROM register WHERE phone = ? AND deleted_at IS NULL',
      [phone]
    );
    
    if (Array.isArray(existingRecord) && existingRecord.length > 0) {
      return res.status(409).json({ 
        error: 'A record with this phone number already exists',
        existing_record: existingRecord[0]
      });
    }

    // Generate receipt number
    const receiptNumber = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Prepare insert data with audit fields
    const insertData = addAuditFieldsForInsert({
      name: name.trim(),
      customer_name: customer_name?.trim() || null,
      username: `user_${Date.now()}`, // Generate unique username
      password: 'temp_password', // This should be hashed in production
      phone: phone.trim(),
      email: email?.trim() || null,
      laundry_items: laundry_items ? JSON.stringify(laundry_items) : null,
      drop_off_date: drop_off_date || new Date(),
      delivery_status: 'pending',
      total_amount: parseFloat(total_amount) || 0.00,
      paid_amount: parseFloat(paid_amount) || 0.00,
      payment_status: payment_status || 'pending',
      notes: notes?.trim() || null,
      receipt_number: receiptNumber,
      role: 'user',
      status: 'active'
    }, req.user);

    const query = `
      INSERT INTO register (
        name, customer_name, username, password, phone, email, 
        laundry_items, drop_off_date, delivery_status, 
        total_amount, paid_amount, payment_status, notes, receipt_number,
        role, status, created_at, updated_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      insertData.name,
      insertData.customer_name,
      insertData.username,
      insertData.password,
      insertData.phone,
      insertData.email,
      insertData.laundry_items,
      insertData.drop_off_date,
      insertData.delivery_status,
      insertData.total_amount,
      insertData.paid_amount,
      insertData.payment_status,
      insertData.notes,
      insertData.receipt_number,
      insertData.role,
      insertData.status,
      insertData.created_at,
      insertData.updated_at,
      insertData.created_by,
      insertData.updated_by
    ]);

    const insertId = (result as any).insertId;

    // Fetch the created record
    const [newRecord] = await db.execute(
      `SELECT 
        r.id,
        r.name,
        r.customer_name,
        r.phone,
        r.email,
        r.laundry_items,
        r.drop_off_date,
        r.delivery_status,
        r.total_amount,
        r.paid_amount,
        r.payment_status,
        r.notes,
        r.receipt_number,
        r.created_at,
        r.created_by
      FROM register r
      WHERE r.id = ?`,
      [insertId]
    );

    res.status(201).json({
      message: `Register entry created successfully`,
      record: newRecord[0]
    });
  } catch (error) {
    console.error('Error creating register entry:', error);
    res.status(500).json({ error: 'Failed to create register entry' });
  }
});

// PUT update register entry
router.put('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      customer_name, 
      phone, 
      email, 
      laundry_items, 
      drop_off_date,
      total_amount,
      paid_amount,
      payment_status,
      delivery_status,
      notes 
    } = req.body;

    // Check if record exists
    const [existingRecord] = await db.execute(
      'SELECT id FROM register WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (Array.isArray(existingRecord) && existingRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Prepare update data with audit fields
    const updateData = addAuditFieldsForUpdate({
      name: name?.trim(),
      customer_name: customer_name?.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      laundry_items: laundry_items ? JSON.stringify(laundry_items) : undefined,
      drop_off_date,
      total_amount: total_amount ? parseFloat(total_amount) : undefined,
      paid_amount: paid_amount ? parseFloat(paid_amount) : undefined,
      payment_status,
      delivery_status,
      notes: notes?.trim()
    }, req.user);

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(id);
    
    const query = `
      UPDATE register 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
    `;
    
    await db.execute(query, updateValues);

    // Fetch updated record
    const [updatedRecord] = await db.execute(
      `SELECT 
        r.id,
        r.name,
        r.customer_name,
        r.phone,
        r.email,
        r.laundry_items,
        r.drop_off_date,
        r.pickup_date,
        r.delivery_status,
        r.total_amount,
        r.paid_amount,
        r.payment_status,
        r.notes,
        r.receipt_number,
        r.updated_at,
        r.updated_by
      FROM register r
      WHERE r.id = ? AND r.deleted_at IS NULL`,
      [id]
    );

    res.json({
      message: 'Register entry updated successfully',
      record: updatedRecord[0]
    });
  } catch (error) {
    console.error('Error updating register entry:', error);
    res.status(500).json({ error: 'Failed to update register entry' });
  }
});

// DELETE register entry (soft delete)
router.delete('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;

    // Check if record exists
    const [existingRecord] = await db.execute(
      'SELECT id, name FROM register WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (Array.isArray(existingRecord) && existingRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Soft delete with audit fields
    const deleteData = addAuditFieldsForDelete({}, req.user);
    
    const query = `
      UPDATE register 
      SET deleted_at = ?, deleted_by = ?
      WHERE id = ? AND deleted_at IS NULL
    `;
    
    await db.execute(query, [
      deleteData.deleted_at,
      deleteData.deleted_by,
      id
    ]);

    res.json({
      message: 'Register entry deleted successfully',
      deleted_record: existingRecord[0]
    });
  } catch (error) {
    console.error('Error deleting register entry:', error);
    res.status(500).json({ error: 'Failed to delete register entry' });
  }
});

// GET register statistics
router.get('/stats/summary', async (req: AuditableRequest, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN delivery_status = 'pending' THEN 1 END) as pending_deliveries,
        COUNT(CASE WHEN delivery_status = 'ready' THEN 1 END) as ready_for_pickup,
        COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN delivery_status = 'cancelled' THEN 1 END) as cancelled,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(SUM(total_amount - IFNULL(paid_amount, 0)), 0) as total_outstanding
      FROM register 
      WHERE deleted_at IS NULL
    `;
    
    const [stats] = await db.execute(query);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching register statistics:', error);
    res.status(500).json({ error: 'Failed to fetch register statistics' });
  }
});

export default router;