import express from 'express';
import { db } from '../index';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all customers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`
      SELECT 
        c.*,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute<RowDataPacket[]>(`
      SELECT 
        c.*,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO customers (name, phone, email, address, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, phone, email || null, address || null, notes || null, req.user?.username]
    );

    // Log the activity
    await db.execute(
      'INSERT INTO audit (emp_id, date, status) VALUES (?, ?, ?)',
      [req.user?.username, new Date().toLocaleString(), `Customer Created: ${name}`]
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customerId: result.insertId
    });

  } catch (error) {
    console.error('Create customer error:', error);
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      res.status(400).json({ error: 'Phone number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, email || null, address || null, notes || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Log the activity
    await db.execute(
      'INSERT INTO audit (emp_id, date, status) VALUES (?, ?, ?)',
      [req.user?.username, new Date().toLocaleString(), `Customer Updated: ${name}`]
    );

    res.json({
      success: true,
      message: 'Customer updated successfully'
    });

  } catch (error) {
    console.error('Update customer error:', error);
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      res.status(400).json({ error: 'Phone number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete customer (admin only)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer has orders
    const [orderCheck] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as order_count FROM orders WHERE customer_id = ?',
      [id]
    );

    if (orderCheck[0].order_count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing orders. Please archive instead.' 
      });
    }

    // Get customer name for logging
    const [customerRows] = await db.execute<RowDataPacket[]>(
      'SELECT name FROM customers WHERE id = ?',
      [id]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerName = customerRows[0].name;

    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM customers WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Log the activity
    await db.execute(
      'INSERT INTO audit (emp_id, date, status) VALUES (?, ?, ?)',
      [req.user?.username, new Date().toLocaleString(), `Customer Deleted: ${customerName}`]
    );

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search customers
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    const [rows] = await db.execute<RowDataPacket[]>(`
      SELECT 
        c.*,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?
      GROUP BY c.id
      ORDER BY c.name
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);

    res.json(rows);
  } catch (error) {
    console.error('Search customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;