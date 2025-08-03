import express from 'express';
import { db } from '../index';
import { auditMiddleware, addAuditFieldsForInsert, addAuditFieldsForUpdate, AuditableRequest } from '../middleware/auditMiddleware';
import { verifyToken } from '../middleware/auth';
import { insertAuditLog } from '../utils/auditUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Apply authentication middleware first, then audit middleware
router.use(verifyToken);
router.use(auditMiddleware);

// GET /api/close-cash/daily-summary - Fetch daily financial summary
router.get('/daily-summary', async (req: AuditableRequest, res) => {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    
    // Get today's orders summary
    const [ordersStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_order_value,
        SUM(paid_amount) as total_paid_amount,
        SUM(total_amount - paid_amount) as total_unpaid_amount,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as fully_paid_orders,
        COUNT(CASE WHEN payment_status = 'partial' THEN 1 END) as partially_paid_orders,
        COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_orders
       FROM orders 
       WHERE DATE(order_date) = ? AND deleted_at IS NULL`,
      [date]
    );

    // Get today's payments by method
    const [paymentsStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
        payment_method,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
       FROM payments 
       WHERE DATE(payment_date) = ? AND deleted_at IS NULL AND status = 'completed'
       GROUP BY payment_method`,
      [date]
    );

    // Get yesterday's close cash amount
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const [yesterdayClose] = await db.execute<RowDataPacket[]>(
      `SELECT cash_amount, total_amount FROM daily_cash_close 
       WHERE close_date = ? ORDER BY created_at DESC LIMIT 1`,
      [yesterdayStr]
    );

    // Get cash transactions for today
    const [cashTransactions] = await db.execute<RowDataPacket[]>(
      `SELECT 
        SUM(amount) as cash_received,
        COUNT(*) as cash_transaction_count
       FROM payments 
       WHERE DATE(payment_date) = ? AND payment_method = 'cash' 
       AND deleted_at IS NULL AND status = 'completed'`,
      [date]
    );

    // Get expenses for today (if expenses table exists)
    const [expensesStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as expense_count
       FROM expenses 
       WHERE DATE(expense_date) = ? AND deleted_at IS NULL`,
      [date]
    ).catch(() => [{ total_expenses: 0, expense_count: 0 }]);

    res.json({
      date,
      orders: ordersStats[0],
      payments: paymentsStats,
      cashTransactions: cashTransactions[0],
      expenses: expensesStats[0] || { total_expenses: 0, expense_count: 0 },
      yesterdayClose: yesterdayClose[0] || { cash_amount: 0, total_amount: 0 }
    });

  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/close-cash/close - Record daily cash close
router.post('/close', async (req: AuditableRequest, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { 
      close_date,
      cash_amount,
      card_amount,
      mobile_amount,
      bank_transfer_amount,
      total_amount,
      notes,
      expenses_amount = 0
    } = req.body;

    if (!close_date || total_amount === undefined) {
      return res.status(400).json({ error: 'Close date and total amount are required' });
    }

    // Check if cash has already been closed for this date
    const [existingClose] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM daily_cash_close WHERE close_date = ?',
      [close_date]
    );

    if (existingClose.length > 0) {
      return res.status(400).json({ error: 'Cash has already been closed for this date' });
    }

    // Create the daily cash close record
    const auditFields = addAuditFieldsForInsert(req);
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO daily_cash_close 
       (close_date, cash_amount, card_amount, mobile_amount, bank_transfer_amount, 
        total_amount, expenses_amount, notes, ${Object.keys(auditFields).join(', ')})
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${Object.values(auditFields).map(() => '?').join(', ')})`,
      [
        close_date,
        cash_amount || 0,
        card_amount || 0,
        mobile_amount || 0,
        bank_transfer_amount || 0,
        total_amount,
        expenses_amount,
        notes || '',
        ...Object.values(auditFields)
      ]
    );

    // Log the cash close action
    await insertAuditLog(
      connection,
      req.auditUser || 'system',
      `Daily cash closed for ${close_date} - Total: ${total_amount}`,
      'daily_cash_close',
      result.insertId.toString()
    );

    await connection.commit();

    res.json({
      success: true,
      close_id: result.insertId,
      message: 'Cash closed successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error closing cash:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// GET /api/close-cash/history - View cash close history
router.get('/history', async (req: AuditableRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const dateFrom = req.query.date_from as string || '';
    const dateTo = req.query.date_to as string || '';

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (dateFrom) {
      whereClause += ' AND close_date >= ?';
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND close_date <= ?';
      queryParams.push(dateTo);
    }

    // Get total count
    const [countResult] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM daily_cash_close ${whereClause}`,
      queryParams
    );

    // Get cash close records
    const [records] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM daily_cash_close 
       ${whereClause}
       ORDER BY close_date DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({
      records,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching cash close history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/close-cash/:id - Get specific cash close record
router.get('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    
    const [records] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM daily_cash_close WHERE close_id = ?',
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({ error: 'Cash close record not found' });
    }

    res.json(records[0]);

  } catch (error) {
    console.error('Error fetching cash close record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/close-cash/:id - Update cash close record
router.put('/:id', async (req: AuditableRequest, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { 
      cash_amount,
      card_amount,
      mobile_amount,
      bank_transfer_amount,
      total_amount,
      notes,
      expenses_amount
    } = req.body;

    // Check if record exists
    const [existing] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM daily_cash_close WHERE close_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Cash close record not found' });
    }

    // Update the record
    const auditFields = addAuditFieldsForUpdate(req);
    await connection.execute(
      `UPDATE daily_cash_close 
       SET cash_amount = ?, card_amount = ?, mobile_amount = ?, 
           bank_transfer_amount = ?, total_amount = ?, expenses_amount = ?, 
           notes = ?, ${Object.keys(auditFields).map(key => `${key} = ?`).join(', ')}
       WHERE close_id = ?`,
      [
        cash_amount || 0,
        card_amount || 0,
        mobile_amount || 0,
        bank_transfer_amount || 0,
        total_amount,
        expenses_amount || 0,
        notes || '',
        ...Object.values(auditFields),
        id
      ]
    );

    // Log the update
    await insertAuditLog(
      connection,
      req.auditUser || 'system',
      `Updated cash close record for ${existing[0].close_date}`,
      'daily_cash_close',
      id
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Cash close record updated successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating cash close record:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

export default router;