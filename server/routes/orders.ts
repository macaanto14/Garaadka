import express from 'express';
import { db } from '../index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuditableRequest } from '../middleware/auditMiddleware.js';
import { addAuditFieldsForInsert, addAuditFieldsForUpdate, addAuditFieldsForDelete } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Helper function to convert ISO date to MySQL datetime format
const formatDateForMySQL = (isoDate: string): string | null => {
  if (!isoDate) return null;
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

// Get all orders with customer and items information
router.get('/', async (req: AuditableRequest, res) => {
  try {
    const { 
      limit = '50', 
      offset = '0', 
      sort_by = 'created_at', 
      sort_order = 'DESC',
      status 
    } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE o.deleted_at IS NULL';
    const queryParams: any[] = [];

    if (status) {
      whereClause += ' AND o.status = ?';
      queryParams.push(status);
    }

    // Validate sort_by to prevent SQL injection
    const allowedSortFields = ['order_id', 'itemNum', 'created_at', 'due_date', 'delivery_date', 'total_amount', 'status'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';

    // Add LIMIT and OFFSET
    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100 records
    const offsetNum = parseInt(offset as string) || 0;

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
       ${whereClause}
       GROUP BY o.order_id
       ORDER BY o.${sortField} ${sortDirection}
       LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offsetNum]
    );

    // Get total count for pagination
    const [countResult] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT o.order_id) as total
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       ${whereClause}`,
      queryParams
    );

    res.json({
      orders,
      pagination: {
        total: countResult[0].total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < countResult[0].total
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET order by ID with customer info
router.get('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    
    // Get order with customer info
    const [orderRows] = await db.execute<RowDataPacket[]>(
      `SELECT o.*, c.customer_name, c.phone_number
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = ? AND o.deleted_at IS NULL`,
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const [items] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM order_items WHERE order_id = ? AND deleted_at IS NULL',
      [id]
    );

    // Get payments
    const [payments] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE order_id = ? AND deleted_at IS NULL ORDER BY payment_date DESC',
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

// POST create order with items and audit logging
router.post('/', async (req: AuditableRequest, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { customer_id, due_date, delivery_date, payment_method, notes, items } = req.body;

    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Customer ID and items are required',
        required_fields: ['customer_id', 'items'],
        items_format: 'Array of objects with item_name, quantity, unit_price'
      });
    }

    // Generate order number
    const [lastOrder] = await connection.execute<RowDataPacket[]>(
      'SELECT order_number FROM orders ORDER BY order_id DESC LIMIT 1'
    );
    
    let orderNumber = 'ORD-001';
    if (lastOrder.length > 0 && lastOrder[0].order_number) {
      const lastNumber = parseInt(lastOrder[0].order_number.split('-')[1]);
      orderNumber = `ORD-${String(lastNumber + 1).padStart(3, '0')}`;
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );

    const orderData = addAuditFieldsForInsert({
      order_number: orderNumber,
      customer_id,
      due_date: formatDateForMySQL(due_date),
      delivery_date: formatDateForMySQL(delivery_date),
      total_amount: totalAmount,
      payment_method: payment_method || null,
      notes: notes || null,
      status: 'pending',
      payment_status: 'unpaid'
    }, req.auditUser || 'system');

    // Create order
    const [orderResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders 
       (order_number, customer_id, due_date, delivery_date, total_amount, payment_method, notes, status, payment_status, created_at, updated_at, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderData.order_number, orderData.customer_id, orderData.due_date, orderData.delivery_date, 
       orderData.total_amount, orderData.payment_method, orderData.notes, orderData.status, 
       orderData.payment_status, orderData.created_at, orderData.updated_at, orderData.created_by, orderData.updated_by]
    );

    const orderId = orderResult.insertId;

    // Create order items with audit fields
    for (const item of items) {
      const itemData = addAuditFieldsForInsert({
        order_id: orderId,
        item_name: item.item_name,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        color: item.color || null,
        size: item.size || null,
        special_instructions: item.special_instructions || null
      }, req.auditUser || 'system');

      await connection.execute(
        `INSERT INTO order_items 
         (order_id, item_name, description, quantity, unit_price, color, size, special_instructions, created_at, updated_at, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemData.order_id, itemData.item_name, itemData.description, itemData.quantity, 
         itemData.unit_price, itemData.color, itemData.size, itemData.special_instructions,
         itemData.created_at, itemData.updated_at, itemData.created_by, itemData.updated_by]
      );
    }

    // Log to audit table - ensure auditUser is not undefined
    const auditUser = req.auditUser || 'system';
    await connection.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [auditUser, new Date().toISOString().slice(0, 19).replace('T', ' '), 
       `Created Order ${orderNumber}`, 'CREATE', 'orders', orderId, JSON.stringify(orderData)]
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

// Update order
router.put('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { customer_id, due_date, delivery_date, status, payment_status, payment_method, notes, total_amount } = req.body;

    // Get old values for audit
    const [oldOrder] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE order_id = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (oldOrder.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Build update data - only include fields that are provided
    // For customer_id, preserve existing value if not provided
    const updateData = addAuditFieldsForUpdate({
      customer_id: customer_id !== undefined ? customer_id : oldOrder[0].customer_id,
      due_date: formatDateForMySQL(due_date),
      delivery_date: formatDateForMySQL(delivery_date),
      status: status !== undefined ? status : oldOrder[0].status,
      payment_status: payment_status !== undefined ? payment_status : oldOrder[0].payment_status,
      payment_method: payment_method !== undefined ? payment_method : oldOrder[0].payment_method,
      notes: notes !== undefined ? notes : oldOrder[0].notes,
      total_amount: total_amount !== undefined ? total_amount : oldOrder[0].total_amount
    }, req.auditUser || 'system');

    // Validate that customer_id is not null
    if (!updateData.customer_id) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE orders SET 
       customer_id = ?, due_date = ?, delivery_date = ?, status = ?, 
       payment_status = ?, payment_method = ?, notes = ?, total_amount = ?, updated_at = ?, updated_by = ?
       WHERE order_id = ? AND deleted_at IS NULL`,
      [updateData.customer_id, updateData.due_date, updateData.delivery_date, 
       updateData.status, updateData.payment_status, updateData.payment_method, 
       updateData.notes, updateData.total_amount, updateData.updated_at, updateData.updated_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Log to audit table - ensure auditUser is not undefined
    const auditUser = req.auditUser || 'system';
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [auditUser, new Date().toISOString().slice(0, 19).replace('T', ' '), 
       'Updated Order', 'UPDATE', 'orders', id, JSON.stringify(oldOrder[0]), JSON.stringify(updateData)]
    );

    res.json({ success: true, message: 'Order updated successfully' });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
router.patch('/:id/status', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Get old values for audit
    const [oldOrder] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE order_id = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (oldOrder.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData = addAuditFieldsForUpdate({ status }, req.auditUser || 'system');

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE orders SET status = ?, updated_at = ?, updated_by = ? WHERE order_id = ? AND deleted_at IS NULL',
      [status, updateData.updated_at, updateData.updated_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Log to audit table
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.auditUser, new Date().toISOString().slice(0, 19).replace('T', ' '), 
       `Updated Order Status to ${status}`, 'UPDATE', 'orders', id, JSON.stringify(oldOrder[0]), JSON.stringify({status})]
    );

    res.json({ success: true, message: 'Order status updated successfully' });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete order (soft delete)
router.delete('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    
    // Get order data before deletion for audit
    const [order] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE order_id = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (order.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const deleteData = addAuditFieldsForDelete(req.auditUser || 'system');

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE orders SET deleted_at = ?, deleted_by = ? WHERE order_id = ? AND deleted_at IS NULL',
      [deleteData.deleted_at, deleteData.deleted_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Also soft delete related order items
    await db.execute(
      'UPDATE order_items SET deleted_at = ?, deleted_by = ? WHERE order_id = ? AND deleted_at IS NULL',
      [deleteData.deleted_at, deleteData.deleted_by, id]
    );

    // Log to audit table
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id, old_values) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.auditUser, new Date().toISOString().slice(0, 19).replace('T', ' '), 
       'Deleted Order', 'DELETE', 'orders', id, JSON.stringify(order[0])]
    );

    res.json({ success: true, message: 'Order deleted successfully' });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order statistics for dashboard
router.get('/stats/dashboard', async (req: AuditableRequest, res) => {
  try {
    const [totalOrders] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE deleted_at IS NULL'
    );

    const [totalRevenue] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(total_amount) as total FROM orders WHERE payment_status = "paid" AND deleted_at IS NULL'
    );

    const [pendingOrders] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE status = "pending" AND deleted_at IS NULL'
    );

    const [washingOrders] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE status = "washing" AND deleted_at IS NULL'
    );

    const [readyOrders] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE status = "ready" AND deleted_at IS NULL'
    );

    const [unpaidAmount] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(total_amount - paid_amount) as total FROM orders WHERE payment_status != "paid" AND deleted_at IS NULL'
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

// Get orders by customer ID
router.get('/customer/:customerId', async (req: AuditableRequest, res) => {
  try {
    const { customerId } = req.params;
    
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
       WHERE o.customer_id = ? AND o.deleted_at IS NULL
       GROUP BY o.order_id
       ORDER BY o.created_at DESC`,
      [customerId]
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;