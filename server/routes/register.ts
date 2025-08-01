import express from 'express';
import { db } from '../index.js';
import { AuditableRequest } from '../middleware/auditMiddleware.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Helper function to clean phone numbers
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)+]/g, '').replace(/^252/, '').replace(/^0+/, '');
}

// Interface for register record from database
interface RegisterRecord {
  itemNum: number;
  NAME: string;
  descr: string;
  quan: number;
  unitprice: number;
  amntword: string;
  duedate: string;
  deliverdate: string;
  totalAmount: number;
  mobnum: number;
  payCheck: string;
  col: string;
  siz: string;
}

// Interface for API response
interface RegisterResponse {
  id: number;
  customer_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount_in_words: string;
  due_date: string;
  delivery_date: string;
  total_amount: number;
  phone_number: string;
  payment_status: string;
  color: string;
  size: string;
  receipt_number: string;
}

// Helper function to transform database record to API response
function transformRecord(record: any): RegisterResponse {
  return {
    id: record.itemNum,
    customer_name: record.NAME,
    description: record.descr,
    quantity: record.quan || 1,
    unit_price: record.unitprice || 0,
    amount_in_words: record.amntword || '',
    due_date: record.duedate,
    delivery_date: record.deliverdate,
    total_amount: record.totalAmount,
    phone_number: record.mobnum ? `+252${record.mobnum.toString().slice(-8)}` : '',
    payment_status: record.payCheck,
    color: record.col || '',
    size: record.siz || '',
    receipt_number: `REG-${record.itemNum.toString().padStart(6, '0')}`
  };
}

// GET /api/register/stats - Get register statistics
router.get('/stats', async (req: AuditableRequest, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN payCheck = 'paid' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN payCheck = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN payCheck = 'partial' THEN 1 END) as partial_payments,
        COUNT(CASE WHEN deliverdate != 'Delivery Date' AND deliverdate != 'null' AND deliverdate != '' THEN 1 END) as delivered_orders,
        COALESCE(SUM(totalAmount), 0) as total_revenue,
        COALESCE(AVG(totalAmount), 0) as average_order_value,
        COUNT(DISTINCT mobnum) as unique_customers,
        COALESCE(SUM(CASE WHEN payCheck = 'paid' THEN totalAmount ELSE 0 END), 0) as total_paid_amount,
        COALESCE(SUM(CASE WHEN payCheck = 'pending' THEN totalAmount ELSE 0 END), 0) as total_pending_amount
      FROM register 
      WHERE NAME != 'HALKAN KU QOR MAGACA MACMIILKA' 
        AND NAME != 'Test'
        AND NAME NOT LIKE '[DELETED]%'
    `;
    
    const [stats] = await db.execute<RowDataPacket[]>(query);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching register statistics:', error);
    res.status(500).json({ error: 'Failed to fetch register statistics' });
  }
});

// GET /api/register/search/:phone - Search register records by phone number
router.get('/search/:phone', async (req: AuditableRequest, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone || phone.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Phone number must be at least 3 characters long',
        example: '612345678'
      });
    }

    // Clean phone number for search - remove spaces, dashes, parentheses, plus signs, country code 252, and leading zeros
    const cleanPhone = phone.replace(/[\s\-\(\)+]/g, '').replace(/^252/, '').replace(/^0+/, '');
    
    const query = `
      SELECT * FROM register 
      WHERE CAST(mobnum AS CHAR) LIKE ?
        AND NAME != 'HALKAN KU QOR MAGACA MACMIILKA' 
        AND NAME != 'Test'
        AND NAME NOT LIKE '[DELETED]%'
      ORDER BY itemNum DESC
    `;
    
    const searchPattern = `%${cleanPhone}%`;
    const [records] = await db.execute(query, [searchPattern]);
    
    if (Array.isArray(records) && records.length === 0) {
      return res.status(404).json({ 
        error: 'No records found for this phone number',
        phone_searched: phone,
        cleaned_phone: cleanPhone
      });
    }
    
    const transformedRecords = (records as any[]).map(transformRecord);
    
    res.json({
      records: transformedRecords,
      total_found: transformedRecords.length,
      phone_searched: phone
    });
  } catch (error) {
    console.error('Error searching register by phone:', error);
    res.status(500).json({ error: 'Failed to search register records' });
  }
});

// GET /api/register - Get all register records with pagination and filtering
router.get('/', async (req: AuditableRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = `WHERE NAME != 'HALKAN KU QOR MAGACA MACMIILKA' 
                        AND NAME != 'Test'
                        AND NAME NOT LIKE '[DELETED]%'`;
    const queryParams: any[] = [];

    // Add status filter
    if (status) {
      if (status === 'paid') {
        whereClause += " AND payCheck = 'paid'";
      } else if (status === 'pending') {
        whereClause += " AND payCheck = 'pending'";
      } else if (status === 'partial') {
        whereClause += " AND payCheck = 'partial'";
      } else if (status === 'delivered') {
        whereClause += " AND deliverdate != 'Delivery Date' AND deliverdate != 'null' AND deliverdate != ''";
      }
    }

    // Add search filter
    if (search) {
      whereClause += " AND (NAME LIKE ? OR descr LIKE ? OR CAST(mobnum AS CHAR) LIKE ?)";
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM register ${whereClause}`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const totalRecords = (countResult as any)[0].total;

    // Get paginated records
    const query = `
      SELECT * FROM register
      ${whereClause}
      ORDER BY itemNum DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(limit, offset);
    const [records] = await db.execute(query, queryParams);
    
    const transformedRecords = (records as any[]).map(transformRecord);
    
    res.json({
      records: transformedRecords,
      pagination: {
        current_page: page,
        per_page: limit,
        total: totalRecords,
        total_pages: Math.ceil(totalRecords / limit),
        has_next: page < Math.ceil(totalRecords / limit),
        has_prev: page > 1
      },
      filters: {
        status: status || 'all',
        search: search || ''
      }
    });
  } catch (error) {
    console.error('Error fetching register records:', error);
    res.status(500).json({ error: 'Failed to fetch register records' });
  }
});

// GET /api/register/:id - Get register record by ID
router.get('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid ID provided' });
    }
    
    const query = `
      SELECT * FROM register 
      WHERE itemNum = ? 
        AND NAME NOT LIKE '[DELETED]%'
    `;
    
    const [records] = await db.execute<RowDataPacket[]>(query, [id]);
    
    if (records.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }
    
    const transformedRecord = transformRecord(records[0]);
    res.json(transformedRecord);
  } catch (error) {
    console.error('Error fetching register record:', error);
    res.status(500).json({ error: 'Failed to fetch register record' });
  }
});

// POST /api/register - Create new register entry
router.post('/', async (req: AuditableRequest, res) => {
  try {
    const { 
      customer_name,
      description,
      quantity,
      unit_price,
      amount_in_words,
      due_date,
      delivery_date,
      total_amount,
      phone_number,
      payment_status,
      color,
      size
    } = req.body;
    
    // Validate required fields
    if (!customer_name || !description || !due_date || !total_amount || !phone_number || !payment_status) {
      return res.status(400).json({ 
        error: 'Required fields are missing',
        required_fields: ['customer_name', 'description', 'due_date', 'total_amount', 'phone_number', 'payment_status']
      });
    }

    // Validate phone number
    const cleanPhone = cleanPhoneNumber(phone_number.toString());
    if (!/^\d{8,9}$/.test(cleanPhone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Must be 8-9 digits.',
        example: '612345678'
      });
    }

    // Validate payment status
    if (!['paid', 'pending', 'partial'].includes(payment_status)) {
      return res.status(400).json({ 
        error: 'Invalid payment status',
        valid_statuses: ['paid', 'pending', 'partial']
      });
    }

    const query = `
      INSERT INTO register (
        NAME, descr, quan, unitprice, amntword, duedate, deliverdate,
        totalAmount, mobnum, payCheck, col, siz
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute<ResultSetHeader>(query, [
      customer_name.trim(),
      description.trim(),
      quantity || 1,
      unit_price || 0,
      amount_in_words || '',
      due_date,
      delivery_date || 'Delivery Date',
      total_amount,
      parseInt(cleanPhone),
      payment_status,
      color || '',
      size || ''
    ]);

    const insertId = result.insertId;

    // Fetch the created record
    const [newRecord] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM register WHERE itemNum = ?',
      [insertId]
    );

    const transformedRecord = transformRecord(newRecord[0]);

    res.status(201).json({
      message: 'Register entry created successfully',
      record: transformedRecord
    });
  } catch (error) {
    console.error('Error creating register entry:', error);
    res.status(500).json({ error: 'Failed to create register entry' });
  }
});

// PUT /api/register/:id - Update register entry
router.put('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid ID provided' });
    }

    // Check if record exists
    const [existingRecord] = await db.execute<RowDataPacket[]>(
      'SELECT itemNum FROM register WHERE itemNum = ? AND NAME NOT LIKE "[DELETED]%"',
      [id]
    );
    
    if (existingRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    const { 
      customer_name,
      description,
      quantity,
      unit_price,
      amount_in_words,
      due_date,
      delivery_date,
      total_amount,
      phone_number,
      payment_status,
      color,
      size
    } = req.body;

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (customer_name !== undefined) {
      updateFields.push('NAME = ?');
      updateValues.push(customer_name.trim());
    }
    if (description !== undefined) {
      updateFields.push('descr = ?');
      updateValues.push(description.trim());
    }
    if (quantity !== undefined) {
      updateFields.push('quan = ?');
      updateValues.push(quantity);
    }
    if (unit_price !== undefined) {
      updateFields.push('unitprice = ?');
      updateValues.push(unit_price);
    }
    if (amount_in_words !== undefined) {
      updateFields.push('amntword = ?');
      updateValues.push(amount_in_words);
    }
    if (due_date !== undefined) {
      updateFields.push('duedate = ?');
      updateValues.push(due_date);
    }
    if (delivery_date !== undefined) {
      updateFields.push('deliverdate = ?');
      updateValues.push(delivery_date);
    }
    if (total_amount !== undefined) {
      updateFields.push('totalAmount = ?');
      updateValues.push(total_amount);
    }
    if (phone_number !== undefined) {
      const cleanPhone = cleanPhoneNumber(phone_number.toString());
      updateFields.push('mobnum = ?');
      updateValues.push(parseInt(cleanPhone));
    }
    if (payment_status !== undefined) {
      if (!['paid', 'pending', 'partial'].includes(payment_status)) {
        return res.status(400).json({ 
          error: 'Invalid payment status',
          valid_statuses: ['paid', 'pending', 'partial']
        });
      }
      updateFields.push('payCheck = ?');
      updateValues.push(payment_status);
    }
    if (color !== undefined) {
      updateFields.push('col = ?');
      updateValues.push(color);
    }
    if (size !== undefined) {
      updateFields.push('siz = ?');
      updateValues.push(size);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(id);
    
    const query = `
      UPDATE register 
      SET ${updateFields.join(', ')}
      WHERE itemNum = ?
    `;
    
    await db.execute(query, updateValues);

    // Fetch updated record
    const [updatedRecord] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM register WHERE itemNum = ?',
      [id]
    );

    const transformedRecord = transformRecord(updatedRecord[0]);

    res.json({
      message: 'Register entry updated successfully',
      record: transformedRecord
    });
  } catch (error) {
    console.error('Error updating register entry:', error);
    res.status(500).json({ error: 'Failed to update register entry' });
  }
});

// PUT /api/register/:id/status - Update delivery status
router.put('/:id/status', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { delivery_status } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid ID provided' });
    }
    
    // Validate delivery status
    if (!delivery_status || !['delivered', 'pending'].includes(delivery_status)) {
      return res.status(400).json({ 
        error: 'Invalid delivery status',
        valid_statuses: ['delivered', 'pending']
      });
    }

    // Check if record exists
    const [existingRecord] = await db.execute<RowDataPacket[]>(
      'SELECT itemNum, NAME FROM register WHERE itemNum = ? AND NAME NOT LIKE "[DELETED]%"',
      [id]
    );
    
    if (existingRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Update delivery status
    const deliverdate = delivery_status === 'delivered' 
      ? new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      : 'Delivery Date';

    const query = `
      UPDATE register 
      SET deliverdate = ?
      WHERE itemNum = ?
    `;
    
    await db.execute(query, [deliverdate, id]);

    // Fetch updated record
    const [updatedRecord] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM register WHERE itemNum = ?',
      [id]
    );

    const transformedRecord = transformRecord(updatedRecord[0]);

    res.json({
      message: `Delivery status updated to ${delivery_status}`,
      record: transformedRecord
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

// DELETE /api/register/:id - Soft delete register entry
router.delete('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid ID provided' });
    }

    // Check if record exists
    const [existingRecord] = await db.execute<RowDataPacket[]>(
      'SELECT itemNum, NAME FROM register WHERE itemNum = ? AND NAME NOT LIKE "[DELETED]%"',
      [id]
    );
    
    if (existingRecord.length === 0) {
      return res.status(404).json({ error: 'Register record not found' });
    }

    // Soft delete by prefixing name with [DELETED]
    const query = `
      UPDATE register 
      SET NAME = CONCAT('[DELETED] ', NAME)
      WHERE itemNum = ? AND NAME NOT LIKE '[DELETED]%'
    `;
    
    await db.execute(query, [id]);

    res.json({
      message: 'Register entry deleted successfully',
      deleted_record: {
        id: existingRecord[0].itemNum,
        customer_name: existingRecord[0].NAME
      }
    });
  } catch (error) {
    console.error('Error deleting register entry:', error);
    res.status(500).json({ error: 'Failed to delete register entry' });
  }
});

export default router;