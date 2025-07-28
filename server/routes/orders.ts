import express from 'express';
import { db } from '../index';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all orders with customer and items information
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.execute<RowDataPacket[]>(
      `SELECT 
        o.*,
        c.customer_name,
        c.phone_number,
        GROUP_CONCAT(
          CONCAT(oi.item_name, ' (', oi.quantity, 'x$', oi.unit_price, ')')
          SEPARATOR ', '
        ) as items_summary,
        COUNT(oi.item_id) as item_count
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       GROUP BY o.order_id
       ORDER BY o.order_date DESC`
    );
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order with customer info
    const [orderRows] = await db.execute<RowDataPacket[]>(
      `SELECT o.*, c.customer_name, c.phone_number, c.email, c.address
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = ?`,
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const [items] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );

    // Get payments
    const [payments] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC',
      [id]
    );

    res.json({
      order: orderRows[0],
      items,
      payments
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order with items
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      customer_id,
      due_date,
      delivery_date,
      items,
      payment_method,
      notes,
      created_by
    } = req.body;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );

    // Create order
    const [orderResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders 
       (order_number, customer_id, due_date, delivery_date, total_amount, payment_method, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, customer_id, due_date, delivery_date, totalAmount, payment_method, notes, created_by]
    );

    const orderId = orderResult.insertId;

    // Create order items
    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items 
         (order_id, item_name, description, quantity, unit_price, color, size, special_instructions) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.item_name, item.description, item.quantity, item.unit_price, 
         item.color, item.size, item.special_instructions]
      );
    }

    // Log the activity
    await connection.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id) VALUES (?, ?, ?, ?, ?, ?)',
      [created_by || 'system', new Date().toLocaleString(), `Created Order ${orderNumber}`, 'CREATE', 'orders', orderId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      order_id: orderId,
      order_number: orderNumber,
      message: 'Order created successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updated_by } = req.body;

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Log the activity
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id) VALUES (?, ?, ?, ?, ?, ?)',
      [updated_by || 'system', new Date().toLocaleString(), `Updated Order Status to ${status}`, 'UPDATE', 'orders', id]
    );

    res.json({ success: true, message: 'Order status updated successfully' });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order statistics for dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const [totalOrders] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders'
    );

    const [totalRevenue] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(total_amount) as total FROM orders WHERE payment_status = "paid"'
    );

    const [pendingOrders] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE status = "pending"'
    );

    const [washingOrders] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE status = "washing"'
    );

    const [readyOrders] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE status = "ready"'
    );

    const [unpaidAmount] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(total_amount - paid_amount) as total FROM orders WHERE payment_status != "paid"'
    );

    res.json({
      totalOrders: totalOrders[0].count,
      totalRevenue: totalRevenue[0].total || 0,
      pendingOrders: pendingOrders[0].count,
      washingOrders: washingOrders[0].count,
      readyOrders: readyOrders[0].count,
      unpaidAmount: unpaidAmount[0].total || 0
    });

  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;