import express from 'express';
import { db } from '../index';
import { auditMiddleware, addAuditFieldsForInsert, addAuditFieldsForUpdate, addAuditFieldsForDelete, AuditableRequest } from '../middleware/auditMiddleware';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware first, then audit middleware
router.use(verifyToken);
router.use(auditMiddleware);

// Get all payments with audit information
router.get('/', async (req: AuditableRequest, res) => {
  try {
    const [payments] = await db.execute<RowDataPacket[]>(
      `SELECT 
        p.*,
        o.order_number,
        c.customer_name,
        c.phone_number
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE p.deleted_at IS NULL
       ORDER BY p.payment_date DESC`
    );
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment by ID
router.get('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const [payments] = await db.execute<RowDataPacket[]>(
      `SELECT 
        p.*,
        o.order_number,
        c.customer_name,
        c.phone_number
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE p.payment_id = ? AND p.deleted_at IS NULL`,
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payments[0]);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new payment with audit logging
router.post('/', async (req: AuditableRequest, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { order_id, amount, payment_method, reference_number, notes } = req.body;

    if (!order_id || !amount || !payment_method) {
      return res.status(400).json({ error: 'Order ID, amount, and payment method are required' });
    }

    // Get order details
    const [orderRows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE order_id = ? AND deleted_at IS NULL',
      [order_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRows[0];

    const paymentData = addAuditFieldsForInsert({
      order_id,
      amount,
      payment_method,
      reference_number,
      notes,
      processed_by: req.auditUser
    }, req.auditUser || 'system');

    // Create payment
    const [paymentResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO payments 
       (order_id, amount, payment_method, reference_number, notes, processed_by, created_at, updated_at, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [paymentData.order_id, paymentData.amount, paymentData.payment_method, 
       paymentData.reference_number, paymentData.notes, paymentData.processed_by,
       paymentData.created_at, paymentData.updated_at, paymentData.created_by, paymentData.updated_by]
    );

    const paymentId = paymentResult.insertId;

    // Update order payment status and paid amount
    const newPaidAmount = (order.paid_amount || 0) + parseFloat(amount);
    let paymentStatus = 'partial';
    
    if (newPaidAmount >= order.total_amount) {
      paymentStatus = 'paid';
    } else if (newPaidAmount === 0) {
      paymentStatus = 'unpaid';
    }

    const orderUpdateData = addAuditFieldsForUpdate({
      paid_amount: newPaidAmount,
      payment_status: paymentStatus
    }, req.auditUser || 'system');

    await connection.execute(
      'UPDATE orders SET paid_amount = ?, payment_status = ?, updated_at = ?, updated_by = ? WHERE order_id = ?',
      [orderUpdateData.paid_amount, orderUpdateData.payment_status, 
       orderUpdateData.updated_at, orderUpdateData.updated_by, order_id]
    );

    // Log to audit table
    await connection.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.auditUser, 
        new Date().toISOString().slice(0, 19).replace('T', ' '), 
        `Added Payment of $${amount}`, 
        'CREATE', 
        'payments', 
        paymentId, 
        JSON.stringify(paymentData)
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      payment_id: paymentId,
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Update payment with audit logging
router.put('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, reference_number, notes } = req.body;

    // Get old values for audit
    const [oldPayment] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE payment_id = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (oldPayment.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const updateData = addAuditFieldsForUpdate({
      amount,
      payment_method,
      reference_number,
      notes,
      processed_by: req.auditUser
    }, req.auditUser || 'system');

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE payments SET 
       amount = ?, payment_method = ?, reference_number = ?, notes = ?, 
       processed_by = ?, updated_at = ?, updated_by = ?
       WHERE payment_id = ? AND deleted_at IS NULL`,
      [updateData.amount, updateData.payment_method, updateData.reference_number, 
       updateData.notes, updateData.processed_by, updateData.updated_at, updateData.updated_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Log to audit table
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.auditUser, new Date().toISOString().slice(0, 19).replace('T', ' '), 
       'Updated Payment', 'UPDATE', 'payments', id, JSON.stringify(oldPayment[0]), JSON.stringify(updateData)]
    );

    res.json({ success: true, message: 'Payment updated successfully' });

  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete payment (soft delete) with audit logging
router.delete('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    
    // Get payment data before deletion for audit
    const [payment] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE payment_id = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (payment.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const deleteData = addAuditFieldsForDelete(req.auditUser || 'system');

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE payments SET deleted_at = ?, deleted_by = ? WHERE payment_id = ? AND deleted_at IS NULL',
      [deleteData.deleted_at, deleteData.deleted_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Log to audit table
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name, record_id, old_values) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.auditUser, new Date().toISOString().slice(0, 19).replace('T', ' '), 
       'Deleted Payment', 'DELETE', 'payments', id, JSON.stringify(payment[0])]
    );

    res.json({ success: true, message: 'Payment deleted successfully' });

  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment statistics with audit information
router.get('/stats/dashboard', async (req: AuditableRequest, res) => {
  try {
    const [totalRevenue] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(amount) as total FROM payments WHERE deleted_at IS NULL'
    );

    const [totalPayments] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM payments WHERE deleted_at IS NULL'
    );

    const [cashPayments] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(amount) as total FROM payments WHERE payment_method = "cash" AND deleted_at IS NULL'
    );

    const [ebirrPayments] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(amount) as total FROM payments WHERE payment_method = "ebirr" AND deleted_at IS NULL'
    );

    const [cbePayments] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(amount) as total FROM payments WHERE payment_method = "cbe" AND deleted_at IS NULL'
    );

    const [bankTransferPayments] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(amount) as total FROM payments WHERE payment_method = "bank_transfer" AND deleted_at IS NULL'
    );

    const [todayPayments] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(amount) as total FROM payments WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL'
    );

    res.json({
      totalRevenue: totalRevenue[0].total || 0,
      totalPayments: totalPayments[0].count,
      cashPayments: cashPayments[0].total || 0,
      ebirrPayments: ebirrPayments[0].total || 0,
      cbePayments: cbePayments[0].total || 0,
      bankTransferPayments: bankTransferPayments[0].total || 0,
      todayPayments: todayPayments[0].total || 0
    });

  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payments by order ID
router.get('/order/:orderId', async (req: AuditableRequest, res) => {
  try {
    const { orderId } = req.params;
    const [payments] = await db.execute<RowDataPacket[]>(
      `SELECT 
        p.*,
        o.order_number,
        c.customer_name
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE p.order_id = ? AND p.deleted_at IS NULL
       ORDER BY p.payment_date DESC`,
      [orderId]
    );

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments for order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;