import express from 'express';
import { db } from '../index';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
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
// Fix around line 182
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
    
    const [records] = await db.execute<RowDataPacket[]>(query, [itemNum]);
    
    if (records.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }
    
    res.json(records[0]);
  } catch (error) {
    console.error('Error fetching register record:', error);
    res.status(500).json({ error: 'Failed to fetch register record' });
  }
});

// Fix around line 236 and other similar issues
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

    // Get current record for audit
    const [currentRecord] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM register WHERE itemNum = ?', 
      [itemNum]
    );
    
    if (currentRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Update record
    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE register SET payCheck = ?, totalAmount = ? WHERE itemNum = ?',
      [payCheck, totalAmount || currentRecord[0].totalAmount, itemNum]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Get updated record
    const [updatedRecord] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM register WHERE itemNum = ?', 
      [itemNum]
    );

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      record: updatedRecord[0]
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Fix around line 381 - Add explicit type annotation
router.patch('/:itemNum', async (req: AuditableRequest, res) => {
  try {
    const { itemNum } = req.params;
    const updates = req.body;
    
    // Get current record for audit
    const [currentRecord] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM register WHERE itemNum = ?', 
      [itemNum]
    );
    
    if (currentRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Build dynamic update query with explicit typing
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    const allowedFields = ['NAME', 'descr', 'quan', 'unitprice', 'amntword', 'duedate', 'deliverdate', 'totalAmount', 'mobnum', 'payCheck', 'col', 'siz'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateValues.push(itemNum);
    
    const updateQuery = `
      UPDATE register 
      SET ${updateFields.join(', ')} 
      WHERE itemNum = ?
    `;
    
    const [result] = await db.execute<ResultSetHeader>(updateQuery, updateValues);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Get updated record
    const [updatedRecord] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM register WHERE itemNum = ?', 
      [itemNum]
    );

    res.json({
      success: true,
      message: 'Register record updated successfully',
      record: updatedRecord[0]
    });

  } catch (error) {
    console.error('Error updating register record:', error);
    res.status(500).json({ error: 'Failed to update register record' });
  }
});

// Fix around line 471
router.delete('/:itemNum', async (req: AuditableRequest, res) => {
  try {
    const { itemNum } = req.params;
    
    // Get record before deletion for audit
    const [existingRecord] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM register WHERE itemNum = ?', 
      [itemNum]
    );
    
    if (existingRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Delete record
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM register WHERE itemNum = ?', 
      [itemNum]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    res.json({
      success: true,
      message: 'Register record deleted successfully',
      deleted_record: existingRecord[0]
    });

  } catch (error) {
    console.error('Error deleting register record:', error);
    res.status(500).json({ error: 'Failed to delete register record' });
  }
});

// Fix around line 495
router.get('/stats/summary', async (req: AuditableRequest, res) => {
  try {
    const [stats] = await db.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN payCheck = 'paid' THEN 1 ELSE 0 END) as paid_records,
        SUM(CASE WHEN payCheck = 'pending' THEN 1 ELSE 0 END) as pending_records,
        SUM(CASE WHEN payCheck = 'partial' THEN 1 ELSE 0 END) as partial_records,
        SUM(totalAmount) as total_amount,
        AVG(totalAmount) as average_amount
      FROM register
    `);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching register stats:', error);
    res.status(500).json({ error: 'Failed to fetch register statistics' });
  }
});

export default router;