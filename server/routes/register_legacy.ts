import express from 'express';
import { db } from '../index';
import { auditMiddleware, AuditableRequest } from '../middleware/auditMiddleware';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware first, then audit middleware
router.use(verifyToken);
router.use(auditMiddleware);

// Interface for legacy register record
interface LegacyRegisterRecord {
  itemNum: number;
  NAME: string;
  descr: string;
  quan?: number;
  unitprice?: number;
  amntword?: string;
  duedate: string;
  deliverdate: string;
  totalAmount: number;
  mobnum: number; // Now supports BIGINT values
  payCheck: string;
  col?: string;
  siz?: string;
}

// GET search register records by phone number (mobnum)
router.get('/search/:phone', async (req: AuditableRequest, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone || phone.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Phone number must be at least 3 characters long',
        example: '252612345678'
      });
    }

    // Clean phone number for search (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    const query = `
      SELECT 
        itemNum,
        NAME,
        descr,
        quan,
        unitprice,
        amntword,
        duedate,
        deliverdate,
        totalAmount,
        mobnum,
        payCheck,
        col,
        siz
      FROM register
      WHERE CAST(mobnum AS CHAR) LIKE ?
      ORDER BY itemNum DESC
    `;
    
    const searchPattern = `%${cleanPhone}%`;
    const [records] = await db.execute(query, [searchPattern]);
    
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
    const paymentStatus = req.query.payment_status as string;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (paymentStatus && ['paid', 'pending', 'partial'].includes(paymentStatus)) {
      whereClause += ' AND payCheck = ?';
      queryParams.push(paymentStatus);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM register ${whereClause}`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const totalRecords = (countResult as any)[0].total;

    // Get paginated records
    const query = `
      SELECT 
        itemNum,
        NAME,
        descr,
        quan,
        unitprice,
        amntword,
        duedate,
        deliverdate,
        totalAmount,
        mobnum,
        payCheck,
        col,
        siz
      FROM register
      ${whereClause}
      ORDER BY itemNum DESC
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
        payment_status: paymentStatus || 'all'
      }
    });
  } catch (error) {
    console.error('Error fetching register records:', error);
    res.status(500).json({ error: 'Failed to fetch register records' });
  }
});

// GET register record by itemNum
router.get('/:itemNum', async (req: AuditableRequest, res) => {
  try {
    const { itemNum } = req.params;
    
    const query = `
      SELECT 
        itemNum,
        NAME,
        descr,
        quan,
        unitprice,
        amntword,
        duedate,
        deliverdate,
        totalAmount,
        mobnum,
        payCheck,
        col,
        siz
      FROM register
      WHERE itemNum = ?
    `;
    
    const [records] = await db.execute(query, [itemNum]);
    
    if (Array.isArray(records) && records.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }
    
    res.json(records[0]);
  } catch (error) {
    console.error('Error fetching register record:', error);
    res.status(500).json({ error: 'Failed to fetch register record' });
  }
});

// PUT update payment status
router.put('/:itemNum/payment', async (req: AuditableRequest, res) => {
  try {
    const { itemNum } = req.params;
    const { payCheck, totalAmount } = req.body;
    
    // Validate payment status
    if (!payCheck || !['paid', 'pending', 'partial'].includes(payCheck)) {
      return res.status(400).json({ 
        error: 'Invalid payment status',
        valid_statuses: ['paid', 'pending', 'partial']
      });
    }

    // Check if record exists
    const [existingRecord] = await db.execute(
      'SELECT itemNum, payCheck FROM register WHERE itemNum = ?',
      [itemNum]
    );
    
    if (Array.isArray(existingRecord) && existingRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    const query = `
      UPDATE register 
      SET payCheck = ?, totalAmount = COALESCE(?, totalAmount)
      WHERE itemNum = ?
    `;
    
    await db.execute(query, [payCheck, totalAmount, itemNum]);

    // Fetch updated record
    const [updatedRecord] = await db.execute(
      `SELECT 
        itemNum,
        NAME,
        payCheck,
        totalAmount,
        mobnum
      FROM register
      WHERE itemNum = ?`,
      [itemNum]
    );

    res.json({
      message: `Payment status updated to ${payCheck}`,
      record: updatedRecord[0]
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// POST create new register entry
router.post('/', async (req: AuditableRequest, res) => {
  try {
    const { 
      NAME, 
      descr, 
      quan, 
      unitprice, 
      amntword, 
      duedate,
      deliverdate,
      totalAmount,
      mobnum,
      payCheck,
      col,
      siz 
    } = req.body;
    
    // Validate required fields
    if (!NAME || !descr || !duedate || !deliverdate || !totalAmount || !mobnum || !payCheck) {
      return res.status(400).json({ 
        error: 'Required fields are missing',
        required_fields: ['NAME', 'descr', 'duedate', 'deliverdate', 'totalAmount', 'mobnum', 'payCheck']
      });
    }

    // Validate phone number (mobnum) - now supports larger numbers
    const mobnumStr = mobnum.toString();
    if (!/^\d+$/.test(mobnumStr)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Must be numeric only',
        example: '252612345678'
      });
    }

    // Validate phone number length (reasonable range)
    if (mobnumStr.length < 8 || mobnumStr.length > 15) {
      return res.status(400).json({ 
        error: 'Phone number must be between 8 and 15 digits',
        example: '252612345678'
      });
    }

    // Validate payment status
    if (!['paid', 'pending', 'partial'].includes(payCheck)) {
      return res.status(400).json({ 
        error: 'Invalid payment status',
        valid_statuses: ['paid', 'pending', 'partial']
      });
    }

    const query = `
      INSERT INTO register (
        NAME, descr, quan, unitprice, amntword, 
        duedate, deliverdate, totalAmount, mobnum, 
        payCheck, col, siz
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      NAME.trim(),
      descr.trim(),
      quan || null,
      unitprice || null,
      amntword?.trim() || null,
      duedate,
      deliverdate,
      totalAmount,
      mobnum, // Now properly handles BIGINT
      payCheck,
      col?.trim() || null,
      siz?.trim() || null
    ]);

    const insertId = (result as any).insertId;

    // Fetch the created record
    const [newRecord] = await db.execute(
      `SELECT 
        itemNum,
        NAME,
        descr,
        quan,
        unitprice,
        amntword,
        duedate,
        deliverdate,
        totalAmount,
        mobnum,
        payCheck,
        col,
        siz
      FROM register
      WHERE itemNum = ?`,
      [insertId]
    );

    res.status(201).json({
      message: 'Register entry created successfully',
      record: newRecord[0]
    });
  } catch (error) {
    console.error('Error creating register entry:', error);
    res.status(500).json({ error: 'Failed to create register entry' });
  }
});

// PUT update register entry
router.put('/:itemNum', async (req: AuditableRequest, res) => {
  try {
    const { itemNum } = req.params;
    const { 
      NAME, 
      descr, 
      quan, 
      unitprice, 
      amntword, 
      duedate,
      deliverdate,
      totalAmount,
      mobnum,
      payCheck,
      col,
      siz 
    } = req.body;

    // Check if record exists
    const [existingRecord] = await db.execute(
      'SELECT itemNum FROM register WHERE itemNum = ?',
      [itemNum]
    );
    
    if (Array.isArray(existingRecord) && existingRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    const fieldsToUpdate = {
      NAME: NAME?.trim(),
      descr: descr?.trim(),
      quan,
      unitprice,
      amntword: amntword?.trim(),
      duedate,
      deliverdate,
      totalAmount,
      mobnum,
      payCheck,
      col: col?.trim(),
      siz: siz?.trim()
    };

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(itemNum);
    
    const query = `
      UPDATE register 
      SET ${updateFields.join(', ')}
      WHERE itemNum = ?
    `;
    
    await db.execute(query, updateValues);

    // Fetch updated record
    const [updatedRecord] = await db.execute(
      `SELECT 
        itemNum,
        NAME,
        descr,
        quan,
        unitprice,
        amntword,
        duedate,
        deliverdate,
        totalAmount,
        mobnum,
        payCheck,
        col,
        siz
      FROM register
      WHERE itemNum = ?`,
      [itemNum]
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

// DELETE register entry (hard delete for legacy table)
router.delete('/:itemNum', async (req: AuditableRequest, res) => {
  try {
    const { itemNum } = req.params;

    // Check if record exists
    const [existingRecord] = await db.execute(
      'SELECT itemNum, NAME FROM register WHERE itemNum = ?',
      [itemNum]
    );
    
    if (Array.isArray(existingRecord) && existingRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    const query = 'DELETE FROM register WHERE itemNum = ?';
    await db.execute(query, [itemNum]);

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
        COUNT(CASE WHEN payCheck = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN payCheck = 'paid' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN payCheck = 'partial' THEN 1 END) as partial_payments,
        COALESCE(SUM(totalAmount), 0) as total_revenue,
        COALESCE(AVG(totalAmount), 0) as average_order_value,
        COUNT(DISTINCT mobnum) as unique_customers
      FROM register
    `;
    
    const [stats] = await db.execute(query);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching register statistics:', error);
    res.status(500).json({ error: 'Failed to fetch register statistics' });
  }
});

// GET orders by date range
router.get('/reports/date-range', async (req: AuditableRequest, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Start date and end date are required',
        format: 'YYYY-MM-DD'
      });
    }

    const query = `
      SELECT 
        itemNum,
        NAME,
        descr,
        totalAmount,
        mobnum,
        payCheck,
        duedate,
        deliverdate
      FROM register
      WHERE duedate BETWEEN ? AND ?
      ORDER BY duedate DESC
    `;
    
    const [records] = await db.execute(query, [start_date, end_date]);
    
    res.json({
      records,
      date_range: {
        start: start_date,
        end: end_date
      },
      total_found: Array.isArray(records) ? records.length : 0
    });
  } catch (error) {
    console.error('Error fetching date range report:', error);
    res.status(500).json({ error: 'Failed to fetch date range report' });
  }
});

export default router;