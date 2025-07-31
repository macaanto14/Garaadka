import express from 'express';
import { db } from '../index.js';
import { auditMiddleware, addAuditFieldsForInsert, addAuditFieldsForUpdate, addAuditFieldsForDelete, AuditableRequest } from '../middleware/auditMiddleware.js';
import { verifyToken } from '../middleware/auth.js';
import { formatAuditDate, insertAuditLog } from '../utils/auditUtils.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Apply authentication middleware first, then audit middleware
router.use(verifyToken);
router.use(auditMiddleware);

// Get all payments with pagination and filtering
router.get('/', async (req: AuditableRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';
    const paymentMethod = req.query.payment_method as string || '';
    const status = req.query.status as string || '';
    const dateFrom = req.query.date_from as string || '';
    const dateTo = req.query.date_to as string || '';

    let whereClause = 'WHERE p.deleted_at IS NULL';
    const queryParams: any[] = [];

    if (search) {
      whereClause += ' AND (c.customer_name LIKE ? OR o.order_number LIKE ? OR p.receipt_number LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (paymentMethod) {
      whereClause += ' AND p.payment_method = ?';
      queryParams.push(paymentMethod);
    }

    if (status) {
      whereClause += ' AND p.status = ?';
      queryParams.push(status);
    }

    if (dateFrom) {
      whereClause += ' AND DATE(p.payment_date) >= ?';
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND DATE(p.payment_date) <= ?';
      queryParams.push(dateTo);
    }

    // Get total count
    const [countResult] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN customers c ON o.customer_id = c.customer_id
       ${whereClause}`,
      queryParams
    );

    // Get payments with pagination
    const [payments] = await db.execute<RowDataPacket[]>(
      `SELECT 
        p.*,
        o.order_number,
        o.total_amount as order_total,
        o.paid_amount as order_paid,
        c.customer_name,
        c.phone_number
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN customers c ON o.customer_id = c.customer_id
       ${whereClause}
       ORDER BY p.payment_date DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({
      payments,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
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
        o.total_amount as order_total,
        o.paid_amount as order_paid,
        o.payment_status as order_payment_status,
        c.customer_name,
        c.phone_number,
        c.email,
        c.address
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE p.payment_id = ? AND p.deleted_at IS NULL`,
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Get payment receipt if exists
    const [receipts] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM payment_receipts WHERE payment_id = ?',
      [id]
    );

    // Get refunds if any
    const [refunds] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM payment_refunds WHERE payment_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({
      ...payments[0],
      receipt: receipts[0] || null,
      refunds
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new payment with receipt generation
router.post('/', async (req: AuditableRequest, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { 
      order_id, 
      amount, 
      payment_method, 
      reference_number, 
      notes,
      generate_receipt = true 
    } = req.body;

    if (!order_id || !amount || !payment_method) {
      return res.status(400).json({ error: 'Order ID, amount, and payment method are required' });
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
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
    const currentPaid = parseFloat(order.paid_amount) || 0;
    const paymentAmount = parseFloat(amount);
    const orderTotal = parseFloat(order.total_amount);

    // Validate payment amount doesn't exceed outstanding balance
    const outstanding = orderTotal - currentPaid;
    if (paymentAmount > outstanding) {
      return res.status(400).json({ 
        error: `Payment amount ($${paymentAmount}) exceeds outstanding balance ($${outstanding})` 
      });
    }

    // Validate payment method
    const [methodCheck] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM payment_methods WHERE method_code = ? AND is_active = TRUE',
      [payment_method]
    );

    if (methodCheck.length === 0) {
      return res.status(400).json({ error: 'Invalid or inactive payment method' });
    }

    const paymentData = addAuditFieldsForInsert({
      order_id,
      amount: paymentAmount,
      payment_method,
      reference_number,
      notes,
      processed_by: req.auditUser,
      status: 'completed'
    }, req.auditUser || 'system');

    // Create payment
    const [paymentResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO payments 
       (order_id, amount, payment_method, reference_number, notes, processed_by, status, created_at, updated_at, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentData.order_id, 
        paymentData.amount, 
        paymentData.payment_method, 
        paymentData.reference_number, 
        paymentData.notes, 
        paymentData.processed_by,
        paymentData.status,
        paymentData.created_at, 
        paymentData.updated_at, 
        paymentData.created_by, 
        paymentData.updated_by
      ]
    );

    const paymentId = paymentResult.insertId;

    // Get the generated receipt number
    const [newPayment] = await connection.execute<RowDataPacket[]>(
      'SELECT receipt_number, transaction_id FROM payments WHERE payment_id = ?',
      [paymentId]
    );

    // Update order payment status and paid amount
    const newPaidAmount = currentPaid + paymentAmount;
    let paymentStatus = 'partial';
    
    if (newPaidAmount >= orderTotal) {
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
      [
        orderUpdateData.paid_amount, 
        orderUpdateData.payment_status, 
        orderUpdateData.updated_at, 
        orderUpdateData.updated_by, 
        order_id
      ]
    );

    // Generate receipt if requested
    let receiptData = null;
    if (generate_receipt) {
      const receiptInfo = {
        payment_id: paymentId,
        receipt_number: newPayment[0].receipt_number,
        transaction_id: newPayment[0].transaction_id,
        order_number: order.order_number,
        customer_name: '', // Will be filled from customer data
        amount: paymentAmount,
        payment_method,
        payment_date: new Date().toISOString(),
        processed_by: req.auditUser
      };

      // Get customer info for receipt
      const [customerInfo] = await connection.execute<RowDataPacket[]>(
        'SELECT customer_name, phone_number FROM customers WHERE customer_id = ?',
        [order.customer_id]
      );

      if (customerInfo.length > 0) {
        receiptInfo.customer_name = customerInfo[0].customer_name;
      }

      await connection.execute(
        `INSERT INTO payment_receipts (payment_id, receipt_number, receipt_data, generated_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          paymentId,
          newPayment[0].receipt_number,
          JSON.stringify(receiptInfo),
          req.auditUser,
          new Date(),
          new Date()
        ]
      );

      receiptData = receiptInfo;
    }

    // Log to audit table
    await insertAuditLog(connection, {
      emp_id: req.auditUser,
      date: formatAuditDate(new Date()),
      status: `Added Payment of $${paymentAmount}`,
      action_type: 'CREATE',
      table_name: 'payments',
      record_id: paymentId,
      new_values: JSON.stringify(paymentData)
    });

    await connection.commit();

    res.status(201).json({
      success: true,
      payment_id: paymentId,
      receipt_number: newPayment[0].receipt_number,
      transaction_id: newPayment[0].transaction_id,
      receipt: receiptData,
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

// Update payment
router.put('/:id', async (req: AuditableRequest, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { amount, payment_method, reference_number, notes, status } = req.body;

    // Get old payment data
    const [oldPayment] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE payment_id = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (oldPayment.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const oldAmount = parseFloat(oldPayment[0].amount);
    const newAmount = parseFloat(amount);

    // Get order details for validation
    const [orderRows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE order_id = ?',
      [oldPayment[0].order_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Associated order not found' });
    }

    const order = orderRows[0];
    const orderTotal = parseFloat(order.total_amount);
    const currentPaid = parseFloat(order.paid_amount);
    
    // Calculate new paid amount if payment amount changed
    const newPaidAmount = currentPaid - oldAmount + newAmount;
    
    if (newPaidAmount > orderTotal) {
      return res.status(400).json({ 
        error: `Updated payment would exceed order total. Maximum allowed: $${orderTotal - (currentPaid - oldAmount)}` 
      });
    }

    const updateData = addAuditFieldsForUpdate({
      amount: newAmount,
      payment_method,
      reference_number,
      notes,
      status: status || oldPayment[0].status,
      processed_by: req.auditUser
    }, req.auditUser || 'system');

    // Update payment
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE payments SET 
       amount = ?, payment_method = ?, reference_number = ?, notes = ?, status = ?,
       processed_by = ?, updated_at = ?, updated_by = ?
       WHERE payment_id = ? AND deleted_at IS NULL`,
      [
        updateData.amount, 
        updateData.payment_method, 
        updateData.reference_number, 
        updateData.notes, 
        updateData.status,
        updateData.processed_by, 
        updateData.updated_at, 
        updateData.updated_by, 
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update order paid amount and status if amount changed
    if (oldAmount !== newAmount) {
      let paymentStatus = 'partial';
      
      if (newPaidAmount >= orderTotal) {
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
        [
          orderUpdateData.paid_amount, 
          orderUpdateData.payment_status, 
          orderUpdateData.updated_at, 
          orderUpdateData.updated_by, 
          oldPayment[0].order_id
        ]
      );
    }

    // Log to audit table
    await insertAuditLog(connection, {
      emp_id: req.auditUser,
      date: formatAuditDate(new Date()),
      status: 'Updated Payment',
      action_type: 'UPDATE',
      table_name: 'payments',
      record_id: id,
      old_values: JSON.stringify(oldPayment[0]),
      new_values: JSON.stringify(updateData)
    });

    await connection.commit();

    res.json({ success: true, message: 'Payment updated successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Delete payment (soft delete)
router.delete('/:id', async (req: AuditableRequest, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    
    // Get payment data before deletion
    const [payment] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE payment_id = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (payment.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentAmount = parseFloat(payment[0].amount);

    // Get order details to update paid amount
    const [orderRows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE order_id = ?',
      [payment[0].order_id]
    );

    if (orderRows.length > 0) {
      const order = orderRows[0];
      const currentPaid = parseFloat(order.paid_amount);
      const newPaidAmount = currentPaid - paymentAmount;
      const orderTotal = parseFloat(order.total_amount);

      let paymentStatus = 'partial';
      if (newPaidAmount >= orderTotal) {
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
        [
          orderUpdateData.paid_amount, 
          orderUpdateData.payment_status, 
          orderUpdateData.updated_at, 
          orderUpdateData.updated_by, 
          payment[0].order_id
        ]
      );
    }

    const deleteData = addAuditFieldsForDelete(req.auditUser || 'system');

    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE payments SET deleted_at = ?, deleted_by = ? WHERE payment_id = ? AND deleted_at IS NULL',
      [deleteData.deleted_at, deleteData.deleted_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Log to audit table
    await insertAuditLog(connection, {
      emp_id: req.auditUser,
      date: formatAuditDate(new Date()),
      status: 'Deleted Payment',
      action_type: 'DELETE',
      table_name: 'payments',
      record_id: id,
      old_values: JSON.stringify(payment[0])
    });

    await connection.commit();

    res.json({ success: true, message: 'Payment deleted successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Get payment statistics
router.get('/stats/dashboard', async (req: AuditableRequest, res) => {
  try {
    const dateFrom = req.query.date_from as string || '';
    const dateTo = req.query.date_to as string || '';

    let dateFilter = '';
    const queryParams: any[] = [];

    if (dateFrom && dateTo) {
      dateFilter = 'AND DATE(p.payment_date) BETWEEN ? AND ?';
      queryParams.push(dateFrom, dateTo);
    } else if (dateFrom) {
      dateFilter = 'AND DATE(p.payment_date) >= ?';
      queryParams.push(dateFrom);
    } else if (dateTo) {
      dateFilter = 'AND DATE(p.payment_date) <= ?';
      queryParams.push(dateTo);
    }

    // Total revenue and payments
    const [totalStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as total_payments,
        AVG(amount) as avg_payment
       FROM payments 
       WHERE deleted_at IS NULL AND status = 'completed' ${dateFilter}`,
      queryParams
    );

    // Payment method breakdown
    const [methodStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
        payment_method,
        SUM(amount) as total,
        COUNT(*) as count
       FROM payments 
       WHERE deleted_at IS NULL AND status = 'completed' ${dateFilter}
       GROUP BY payment_method`,
      queryParams
    );

    // Today's payments
    const [todayStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
        SUM(amount) as today_revenue,
        COUNT(*) as today_payments
       FROM payments 
       WHERE DATE(payment_date) = CURDATE() AND deleted_at IS NULL AND status = 'completed'`
    );

    // Outstanding payments (orders with unpaid/partial status)
    const [outstandingStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as outstanding_orders,
        SUM(total_amount - paid_amount) as outstanding_amount
       FROM orders 
       WHERE payment_status IN ('unpaid', 'partial') AND deleted_at IS NULL`
    );

    // Recent payments
    const [recentPayments] = await db.execute<RowDataPacket[]>(
      `SELECT 
        p.payment_id,
        p.amount,
        p.payment_method,
        p.payment_date,
        p.receipt_number,
        o.order_number,
        c.customer_name
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE p.deleted_at IS NULL
       ORDER BY p.payment_date DESC
       LIMIT 10`
    );

    res.json({
      totalRevenue: totalStats[0].total_revenue || 0,
      totalPayments: totalStats[0].total_payments || 0,
      avgPayment: totalStats[0].avg_payment || 0,
      todayRevenue: todayStats[0].today_revenue || 0,
      todayPayments: todayStats[0].today_payments || 0,
      outstandingOrders: outstandingStats[0].outstanding_orders || 0,
      outstandingAmount: outstandingStats[0].outstanding_amount || 0,
      paymentMethods: methodStats,
      recentPayments
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
        o.total_amount as order_total,
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

// Get payment methods
router.get('/methods/active', async (req: AuditableRequest, res) => {
  try {
    const [methods] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM payment_methods WHERE is_active = TRUE ORDER BY sort_order, method_name'
    );

    res.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process refund
router.post('/:id/refund', async (req: AuditableRequest, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { refund_amount, refund_reason, refund_method } = req.body;

    if (!refund_amount || !refund_reason || !refund_method) {
      return res.status(400).json({ error: 'Refund amount, reason, and method are required' });
    }

    // Get payment details
    const [payment] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE payment_id = ? AND deleted_at IS NULL',
      [id]
    );

    if (payment.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentAmount = parseFloat(payment[0].amount);
    const refundAmountNum = parseFloat(refund_amount);

    if (refundAmountNum > paymentAmount) {
      return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
    }

    // Create refund record
    const [refundResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO payment_refunds 
       (payment_id, refund_amount, refund_reason, refund_method, processed_by, processed_at, status, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
      [
        id, 
        refundAmountNum, 
        refund_reason, 
        refund_method, 
        req.auditUser, 
        new Date(),
        req.auditUser,
        req.auditUser
      ]
    );

    // Update payment with refund amount
    await connection.execute(
      'UPDATE payments SET refund_amount = refund_amount + ?, refund_reason = ?, updated_at = ?, updated_by = ? WHERE payment_id = ?',
      [refundAmountNum, refund_reason, new Date(), req.auditUser, id]
    );

    // Log to audit table
    await insertAuditLog(connection, {
      emp_id: req.auditUser,
      date: formatAuditDate(new Date()),
      status: `Processed refund of $${refundAmountNum}`,
      action_type: 'CREATE',
      table_name: 'payment_refunds',
      record_id: refundResult.insertId,
      new_values: JSON.stringify({ payment_id: id, refund_amount: refundAmountNum, refund_reason })
    });

    await connection.commit();

    res.status(201).json({
      success: true,
      refund_id: refundResult.insertId,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Generate receipt
router.post('/:id/receipt', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;

    // Get payment details with order and customer info
    const [paymentData] = await db.execute<RowDataPacket[]>(
      `SELECT 
        p.*,
        o.order_number,
        o.total_amount as order_total,
        c.customer_name,
        c.phone_number,
        c.email
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE p.payment_id = ? AND p.deleted_at IS NULL`,
      [id]
    );

    if (paymentData.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentData[0];

    // Check if receipt already exists
    const [existingReceipt] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM payment_receipts WHERE payment_id = ?',
      [id]
    );

    if (existingReceipt.length > 0) {
      return res.json({
        success: true,
        receipt: JSON.parse(existingReceipt[0].receipt_data),
        message: 'Receipt already exists'
      });
    }

    // Generate new receipt
    const receiptData = {
      payment_id: payment.payment_id,
      receipt_number: payment.receipt_number,
      transaction_id: payment.transaction_id,
      order_number: payment.order_number,
      customer_name: payment.customer_name,
      customer_phone: payment.phone_number,
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      processed_by: payment.processed_by,
      generated_at: new Date().toISOString()
    };

    // Save receipt
    await db.execute(
      `INSERT INTO payment_receipts (payment_id, receipt_number, receipt_data, generated_by)
       VALUES (?, ?, ?, ?)`,
      [id, payment.receipt_number, JSON.stringify(receiptData), req.auditUser]
    );

    res.json({
      success: true,
      receipt: receiptData,
      message: 'Receipt generated successfully'
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;