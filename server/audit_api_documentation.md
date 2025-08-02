# Audit Logs API Documentation

## Overview
The Audit Logs API provides comprehensive tracking and management of all system activities, user actions, and data changes. It offers powerful filtering, analytics, and export capabilities for compliance and monitoring purposes.

## Base URL
Trae

I can see the issue! The frontend is trying to connect to http://localhost:5000 but your server is likely running on port 3000. Let me check the current server configuration and the frontend API configuration to fix this mismatch.

index.ts 1 - 50

Perfect! I can see that the server is configured to run on port 5000 (line 18: const PORT = process.env.PORT || 5000; ), so the frontend is making the correct request to http://localhost:5000 . The issue is that the API is returning a 404 error with the message "No records found for this phone number" for the phone number 0915068242 .

Let me check if the server is actually running and if there are any records in the database with that phone number. First, let me check the current register.ts implementation:

routes\register.ts 50 - 100

Now let me check if there are any records in the database with that phone number. Let me also check what data exists in the register table:

Search codebase for '0915068242'

Let me check what sample data exists in the register table by looking at the SQL files:

setup_legacy_register_fixed.sql 50 - 100

I can see the issue! The sample data in the database has phone numbers like 252612345678 , 252613456789 , etc., but the user is searching for 0915068242 . The phone number 0915068242 doesn't exist in the sample data.

Let me check if there's any data with phone numbers starting with 091 or similar:

Search codebase for '091\d+'

Great! I found the issue. Looking at the legacy.sql file, I can see there are phone numbers that start with 915 (like 915740910 , 915091888 , 915091714 , etc.), but the user is searching for 0915068242 which doesn't exist in the database.

However, I notice that the phone numbers in the legacy data are stored without the leading 0 (e.g., 915740910 instead of 0915740910 ). Let me check if there's a phone number 915068242 in the data:

Search codebase for '915068242'

Perfect! I found the issue. The phone number 915068242 does exist in the database, but the user is searching for 0915068242 (with a leading 0 ). The search logic in the register.ts file is designed to handle this by removing the leading 252 country code, but it's not properly handling the leading 0 .

Let me check the current search logic in the register.ts file:

routes\register.ts 80 - 120

I found the issue! The phone number cleaning logic on line 103 is:

```
const cleanPhone = phone.replace(/
[\s\-\(\)+]/g, '').replace(/^252/, 
'');
```
This removes the country code 252 but doesn't remove the leading 0 . When the user searches for 0915068242 , it becomes 0915068242 after cleaning, but the database stores it as 915068242 (without the leading 0 ).

Let me fix this by updating the phone number cleaning logic to also remove leading zeros:

routes\register.ts 90 - 555

Now I need to fix the phone number cleaning logic. The issue is on line 103 where it only removes the country code 252 but not the leading 0 . Let me update this:

```
// GET /api/register/search/:phone 
- Search register records by phone 
number
router.get('/search/:phone', async 
(req: AuditableRequest, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone || phone.trim().
    length < 3) {
      return res.status(400).json({ 
        error: 'Phone number must 
        be at least 3 characters 
        long',
        example: '612345678'
      });
    }

    // Clean phone number for 
    search - remove spaces, dashes, 
    parentheses, plus signs, 
    country code 252, and leading 
    zeros
    const cleanPhone = phone.replace
    (/[\s\-\(\)+]/g, '').replace(/
    ^252/, '').replace(/^0+/, '');
    
    const query = `
      SELECT * FROM register 
      WHERE CAST(mobnum AS CHAR) 
      LIKE ?
        AND NAME != 'HALKAN KU QOR 
        MAGACA MACMIILKA' 
        AND NAME != 'Test'
        AND NAME NOT LIKE '[DELETED]
        %'
      ORDER BY itemNum DESC
    `;
    
    const searchPattern = `%$
    {cleanPhone}%`;
    const [records] = await db.
    execute(query, [searchPattern]);
    
    if (Array.isArray(records) && 
    records.length === 0) {
      return res.status(404).json({ 
        error: 'No records found 
        for this phone number',
        phone_searched: phone,
        cleaned_phone: cleanPhone
      });
    }
    
    const transformedRecords = 
    (records as any[]).map
    (transformRecord);
    
    res.json({
      records: transformedRecords,
      total_found: 
      transformedRecords.length,
      phone_searched: phone
    });
  } catch (error) {
    console.error('Error searching 
    register by phone:', error);
    res.status(500).json({ error: 
    'Failed to search register 
    records' });
  }
});
// ... existing code ...
```
I also need to update the phone number cleaning logic in the POST and PUT endpoints to be consistent. Let me create the updated file:

```
import express from 'express';
import { db } from '../index.js';
import { AuditableRequest } from 
'../middleware/auditMiddleware.js';

const router = express.Router();

// Interface for register record 
from database
interface RegisterRecord {
  itemNum: number;
  NAME: string;
  descr: string;
  quan: number;
  unitprice: number;
  amntword: string;
  duedate: string;
  deliverdate: string;
  totalAmount: number;
  mobnum: number;
  payCheck: string;
  col: string;
  siz: string;
}

// Interface for API response
interface RegisterResponse {
  id: number;
  customer_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount_in_words: string;
  due_date: string;
  delivery_date: string;
  total_amount: number;
  phone_number: string;
  payment_status: string;
  color: string;
  size: string;
  receipt_number: string;
}

// Helper function to transform 
database record to API response
function transformRecord(record: 
any): RegisterResponse {
  return {
    id: record.itemNum,
    customer_name: record.NAME,
    description: record.descr,
    quantity: record.quan || 1,
    unit_price: record.unitprice || 
    0,
    amount_in_words: record.
    amntword || '',
    due_date: record.duedate,
    delivery_date: record.
    deliverdate,
    total_amount: record.
    totalAmount,
    phone_number: record.mobnum ? `
    +252${record.mobnum.toString().
    slice(-8)}` : '',
    payment_status: record.payCheck,
    color: record.col || '',
    size: record.siz || '',
    receipt_number: `REG-${record.
    itemNum.toString().padStart(6, 
    '0')}`
  };
}

// Helper function to clean phone 
numbers consistently
function cleanPhoneNumber(phone: 
string): string {
  return phone.replace(/[\s\-\(\)+]/
  g, '').replace(/^252/, '').replace
  (/^0+/, '');
}

// GET /api/register/stats - Get 
register statistics
router.get('/stats', async (req: 
AuditableRequest, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN payCheck = 
        'paid' THEN 1 END) as 
        paid_orders,
        COUNT(CASE WHEN payCheck = 
        'pending' THEN 1 END) as 
        pending_orders,
        COUNT(CASE WHEN payCheck = 
        'partial' THEN 1 END) as 
        partial_payments,
        COUNT(CASE WHEN deliverdate 
        != 'Delivery Date' AND 
        deliverdate != 'null' AND 
        deliverdate != '' THEN 1 
        END) as delivered_orders,
        COALESCE(SUM(totalAmount), 
        0) as total_revenue,
        COALESCE(AVG(totalAmount), 
        0) as average_order_value,
        COUNT(DISTINCT mobnum) as 
        unique_customers,
        COALESCE(SUM(CASE WHEN 
        payCheck = 'paid' THEN 
        totalAmount ELSE 0 END), 0) 
        as total_paid_amount,
        COALESCE(SUM(CASE WHEN 
        payCheck = 'pending' THEN 
        totalAmount ELSE 0 END), 0) 
        as total_pending_amount
      FROM register 
      WHERE NAME != 'HALKAN KU QOR 
      MAGACA MACMIILKA' 
        AND NAME != 'Test'
        AND NAME NOT LIKE '[DELETED]
        %'
    `;
    
    const [stats] = await db.execute
    (query);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching 
    register statistics:', error);
    res.status(500).json({ error: 
    'Failed to fetch register 
    statistics' });
  }
});

// GET /api/register/search/:phone 
- Search register records by phone 
number
router.get('/search/:phone', async 
(req: AuditableRequest, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone || phone.trim().
    length < 3) {
      return res.status(400).json({ 
        error: 'Phone number must 
        be at least 3 characters 
        long',
        example: '612345678'
      });
    }

    // Clean phone number for 
    search - remove spaces, dashes, 
    parentheses, plus signs, 
    country code 252, and leading 
    zeros
    const cleanPhone = 
    cleanPhoneNumber(phone);
    
    const query = `
      SELECT * FROM register 
      WHERE CAST(mobnum AS CHAR) 
      LIKE ?
        AND NAME != 'HALKAN KU QOR 
        MAGACA MACMIILKA' 
        AND NAME != 'Test'
        AND NAME NOT LIKE '[DELETED]
        %'
      ORDER BY itemNum DESC
    `;
    
    const searchPattern = `%$
    {cleanPhone}%`;
    const [records] = await db.
    execute(query, [searchPattern]);
    
    if (Array.isArray(records) && 
    records.length === 0) {
      return res.status(404).json({ 
        error: 'No records found 
        for this phone number',
        phone_searched: phone,
        cleaned_phone: cleanPhone
      });
    }
    
    const transformedRecords = 
    (records as any[]).map
    (transformRecord);
    
    res.json({
      records: transformedRecords,
      total_found: 
      transformedRecords.length,
      phone_searched: phone
    });
  } catch (error) {
    console.error('Error searching 
    register by phone:', error);
    res.status(500).json({ error: 
    'Failed to search register 
    records' });
  }
});

// GET /api/register - Get all 
register records with pagination 
and filtering
router.get('/', async (req: 
AuditableRequest, res) => {
  try {
    const page = parseInt(req.query.
    page as string) || 1;
    const limit = parseInt(req.
    query.limit as string) || 10;
    const status = req.query.status 
    as string;
    const search = req.query.search 
    as string;
    const offset = (page - 1) * 
    limit;

    // Build WHERE clause
    let whereClause = `WHERE NAME 
    != 'HALKAN KU QOR MAGACA 
    MACMIILKA' 
                        AND NAME != 
                        'Test'
                        AND NAME 
                        NOT LIKE '
                        [DELETED]
                        %'`;
    const queryParams: any[] = [];

    // Add status filter
    if (status) {
      if (status === 'paid') {
        whereClause += " AND 
        payCheck = 'paid'";
      } else if (status === 
      'pending') {
        whereClause += " AND 
        payCheck = 'pending'";
      } else if (status === 
      'partial') {
        whereClause += " AND 
        payCheck = 'partial'";
      } else if (status === 
      'delivered') {
        whereClause += " AND 
        deliverdate != 'Delivery 
        Date' AND deliverdate != 
        'null' AND deliverdate != 
        ''";
      }
    }

    // Add search filter
    if (search) {
      whereClause += " AND (NAME 
      LIKE ? OR descr LIKE ? OR CAST
      (mobnum AS CHAR) LIKE ?)";
      const searchPattern = `%$
      {search}%`;
      queryParams.push
      (searchPattern, 
      searchPattern, searchPattern);
    }

    // Get total count
    const countQuery = `SELECT COUNT
    (*) as total FROM register $
    {whereClause}`;
    const [countResult] = await db.
    execute(countQuery, 
    queryParams);
    const totalRecords = 
    (countResult as any)[0].total;

    // Get paginated records
    const query = `
      SELECT * FROM register
      ${whereClause}
      ORDER BY itemNum DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(limit, offset);
    const [records] = await db.
    execute(query, queryParams);
    
    const transformedRecords = 
    (records as any[]).map
    (transformRecord);
    
    res.json({
      records: transformedRecords,
      pagination: {
        current_page: page,
        per_page: limit,
        total: totalRecords,
        total_pages: Math.ceil
        (totalRecords / limit),
        has_next: page < Math.ceil
        (totalRecords / limit),
        has_prev: page > 1
      },
      filters: {
        status: status || 'all',
        search: search || ''
      }
    });
  } catch (error) {
    console.error('Error fetching 
    register records:', error);
    res.status(500).json({ error: 
    'Failed to fetch register 
    records' });
  }
});

// GET /api/register/:id - Get 
register record by ID
router.get('/:id', async (req: 
AuditableRequest, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) 
    {
      return res.status(400).json({ 
      error: 'Invalid ID 
      provided' });
    }
    
    const query = `
      SELECT * FROM register 
      WHERE itemNum = ? 
        AND NAME NOT LIKE '[DELETED]
        %'
    `;
    
    const [records] = await db.
    execute(query, [id]);
    
    if (Array.isArray(records) && 
    records.length === 0) {
      return res.status(404).json({ 
      error: 'Register record not 
      found' });
    }
    
    const transformedRecord = 
    transformRecord(records[0]);
    res.json(transformedRecord);
  } catch (error) {
    console.error('Error fetching 
    register record:', error);
    res.status(500).json({ error: 
    'Failed to fetch register 
    record' });
  }
});

// POST /api/register - Create new 
register entry
router.post('/', async (req: 
AuditableRequest, res) => {
  try {
    const { 
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
    } = req.body;
    
    // Validate required fields
    if (!customer_name || 
    !description || !due_date || 
    !total_amount || 
    !phone_number || 
    !payment_status) {
      return res.status(400).json({ 
        error: 'Required fields are 
        missing',
        required_fields: 
        ['customer_name', 
        'description', 'due_date', 
        'total_amount', 
        'phone_number', 
        'payment_status']
      });
    }

    // Validate phone number
    const cleanPhone = 
    cleanPhoneNumber(phone_number.
    toString());
    if (!/^\d{8,9}$/.test
    (cleanPhone)) {
      return res.status(400).json({ 
        error: 'Invalid phone 
        number format. Must be 8-9 
        digits.',
        example: '612345678'
      });
    }

    // Validate payment status
    if (!['paid', 'pending', 
    'partial'].includes
    (payment_status)) {
      return res.status(400).json({ 
        error: 'Invalid payment 
        status',
        valid_statuses: ['paid', 
        'pending', 'partial']
      });
    }

    const query = `
      INSERT INTO register (
        NAME, descr, quan, 
        unitprice, amntword, 
        duedate, deliverdate,
        totalAmount, mobnum, 
        payCheck, col, siz
      ) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
       ?, ?)
    `;
    
    const [result] = await db.
    execute(query, [
      customer_name.trim(),
      description.trim(),
      quantity || 1,
      unit_price || 0,
      amount_in_words || '',
      due_date,
      delivery_date || 'Delivery 
      Date',
      total_amount,
      parseInt(cleanPhone),
      payment_status,
      color || '',
      size || ''
    ]);

    const insertId = (result as 
    any).insertId;

    // Fetch the created record
    const [newRecord] = await db.
    execute(
      'SELECT * FROM register WHERE 
      itemNum = ?',
      [insertId]
    );

    const transformedRecord = 
    transformRecord(newRecord[0]);

    res.status(201).json({
      message: 'Register entry 
      created successfully',
      record: transformedRecord
    });
  } catch (error) {
    console.error('Error creating 
    register entry:', error);
    res.status(500).json({ error: 
    'Failed to create register 
    entry' });
  }
});

// PUT /api/register/:id - Update 
register entry
router.put('/:id', async (req: 
AuditableRequest, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) 
    {
      return res.status(400).json({ 
      error: 'Invalid ID 
      provided' });
    }

    // Check if record exists
    const [existingRecord] = await 
    db.execute(
      'SELECT itemNum FROM register 
      WHERE itemNum = ? AND NAME 
      NOT LIKE "[DELETED]%"',
      [id]
    );
    
    if (Array.isArray
    (existingRecord) && 
    existingRecord.length === 0) {
      return res.status(404).json({ 
      error: 'Register record not 
      found' });
    }

    const { 
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
    } = req.body;

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (customer_name !== 
    undefined) {
      updateFields.push('NAME = ?');
      updateValues.push
      (customer_name.trim());
    }
    if (description !== undefined) {
      updateFields.push('descr = ?
      ');
      updateValues.push(description.
      trim());
    }
    if (quantity !== undefined) {
      updateFields.push('quan = ?');
      updateValues.push(quantity);
    }
    if (unit_price !== undefined) {
      updateFields.push('unitprice 
      = ?');
      updateValues.push(unit_price);
    }
    if (amount_in_words !== 
    undefined) {
      updateFields.push('amntword 
      = ?');
      updateValues.push
      (amount_in_words);
    }
    if (due_date !== undefined) {
      updateFields.push('duedate = ?
      ');
      updateValues.push(due_date);
    }
    if (delivery_date !== 
    undefined) {
      updateFields.push
      ('deliverdate = ?');
      updateValues.push
      (delivery_date);
    }
    if (total_amount !== undefined) 
    {
      updateFields.push
      ('totalAmount = ?');
      updateValues.push
      (total_amount);
    }
    if (phone_number !== undefined) 
    {
      const cleanPhone = 
      cleanPhoneNumber(phone_number.
      toString());
      updateFields.push('mobnum = ?
      ');
      updateValues.push(parseInt
      (cleanPhone));
    }
    if (payment_status !== 
    undefined) {
      if (!['paid', 'pending', 
      'partial'].includes
      (payment_status)) {
        return res.status(400).json
        ({ 
          error: 'Invalid payment 
          status',
          valid_statuses: ['paid', 
          'pending', 'partial']
        });
      }
      updateFields.push('payCheck 
      = ?');
      updateValues.push
      (payment_status);
    }
    if (color !== undefined) {
      updateFields.push('col = ?');
      updateValues.push(color);
    }
    if (size !== undefined) {
      updateFields.push('siz = ?');
      updateValues.push(size);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
      error: 'No valid fields to 
      update' });
    }

    updateValues.push(id);
    
    const query = `
      UPDATE register 
      SET ${updateFields.join(', ')}
      WHERE itemNum = ?
    `;
    
    await db.execute(query, 
    updateValues);

    // Fetch updated record
    const [updatedRecord] = await 
    db.execute(
      'SELECT * FROM register WHERE 
      itemNum = ?',
      [id]
    );

    const transformedRecord = 
    transformRecord(updatedRecord
    [0]);

    res.json({
      message: 'Register entry 
      updated successfully',
      record: transformedRecord
    });
  } catch (error) {
    console.error('Error updating 
    register entry:', error);
    res.status(500).json({ error: 
    'Failed to update register 
    entry' });
  }
});

// PUT /api/register/:id/status - 
Update delivery status
router.put('/:id/status', async 
(req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { delivery_status } = req.
    body;
    
    if (!id || isNaN(parseInt(id))) 
    {
      return res.status(400).json({ 
      error: 'Invalid ID 
      provided' });
    }
    
    // Validate delivery status
    if (!delivery_status || !
    ['delivered', 'pending'].
    includes(delivery_status)) {
      return res.status(400).json({ 
        error: 'Invalid delivery 
        status',
        valid_statuses: 
        ['delivered', 'pending']
      });
    }

    // Check if record exists
    const [existingRecord] = await 
    db.execute(
      'SELECT itemNum, NAME FROM 
      register WHERE itemNum = ? 
      AND NAME NOT LIKE "[DELETED]
      %"',
      [id]
    );
    
    if (Array.isArray
    (existingRecord) && 
    existingRecord.length === 0) {
      return res.status(404).json({ 
      error: 'Register record not 
      found' });
    }

    // Update delivery status
    const deliverdate = 
    delivery_status === 'delivered' 
      ? new Date().toISOString().
      split('T')[0] // YYYY-MM-DD 
      format
      : 'Delivery Date';

    const query = `
      UPDATE register 
      SET deliverdate = ?
      WHERE itemNum = ?
    `;
    
    await db.execute(query, 
    [deliverdate, id]);

    // Fetch updated record
    const [updatedRecord] = await 
    db.execute(
      'SELECT * FROM register WHERE 
      itemNum = ?',
      [id]
    );

    const transformedRecord = 
    transformRecord(updatedRecord
    [0]);

    res.json({
      message: `Delivery status 
      updated to ${delivery_status}
      `,
      record: transformedRecord
    });
  } catch (error) {
    console.error('Error updating 
    delivery status:', error);
    res.status(500).json({ error: 
    'Failed to update delivery 
    status' });
  }
});

// DELETE /api/register/:id - Soft 
delete register entry
router.delete('/:id', async (req: 
AuditableRequest, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) 
    {
      return res.status(400).json({ 
      error: 'Invalid ID 
      provided' });
    }

    // Check if record exists
    const [existingRecord] = await 
    db.execute(
      'SELECT itemNum, NAME FROM 
      register WHERE itemNum = ? 
      AND NAME NOT LIKE "[DELETED]
      %"',
      [id]
    );
    
    if (Array.isArray
    (existingRecord) && 
    existingRecord.length === 0) {
      return res.status(404).json({ 
      error: 'Register record not 
      found' });
    }

    // Soft delete by prefixing 
    name with [DELETED]
    const query = `
      UPDATE register 
      SET NAME = CONCAT('[DELETED] 
      ', NAME)
      WHERE itemNum = ? AND NAME 
      NOT LIKE '[DELETED]%'
    `;
    
    await db.execute(query, [id]);

    res.json({
      message: 'Register entry 
      deleted successfully',
      deleted_record: {
        id: existingRecord[0].
        itemNum,
        customer_name: 
        existingRecord[0].NAME
      }
    });
  } catch (error) {
    console.error('Error deleting 
    register entry:', error);
    res.status(500).json({ error: 
    'Failed to delete register 
    entry' });
  }
});

export default router;
```
The key changes I made:

1. 1.
   Added a cleanPhoneNumber helper function (line 63-65) that consistently removes spaces, dashes, parentheses, plus signs, country code 252 , and leading zeros .
2. 2.
   Updated the search endpoint (line 103) to use this helper function, so when someone searches for 0915068242 , it becomes 915068242 which matches the database.
3. 3.
   Updated the POST and PUT endpoints to use the same phone cleaning logic for consistency.
4. 4.
   Added debugging info in the search response to show both the original phone searched and the cleaned phone for troubleshooting.
Now when the user searches for 0915068242 , the system will:

1. 1.
   Remove the leading 0 → 915068242
2. 2.
   Search for records containing 915068242
3. 3.
   Find the matching records in the database
The search should now work correctly! The user should restart the server and try the search again.

bitbirr

Copy

Delete

Implement the Audit Logs API services.

ere are all the audit API endpoints you now have available:

### 1. GET /api/audit - Get audit logs with filtering

- Query parameters: table_name , action_type , emp_id , start_date , end_date , limit , offset , search , sort_by , sort_order

### 2. GET /api/audit/stats - Get comprehensive statistics

- Returns: total logs, today's logs, weekly logs, action stats, table stats, user stats, hourly stats, daily stats

### 3. GET /api/audit/record/:table/:id - Get audit history for specific record

- Returns: all audit entries for a specific record

### 4. GET /api/audit/user/:username - Get user activity logs

- Query parameters: limit , offset

### 5. GET /api/audit/analytics/timeline - Get audit logs with time-based aggregation

- Query parameters: start_date , end_date , group_by (hour/day/week/month)

### 6. GET /api/audit/export - Export audit logs as CSV

- Query parameters: same as GET /api/audit

### 7. POST /api/audit - Create manual audit log entry

- Body: table_name , record_id , action_type , status , old_values , new_values

### 8. DELETE /api/audit/cleanup - Clean up old audit logs

- Query parameters: retention_days (default: 365)

Trae

I'll implement the comprehensive Audit Logs API services based on your specifications. Let me first examine the current audit table structure and then create the complete implementation.

routes\audit.ts 1 - 100

routes\audit.ts 200 - 224

Now let me check the audit table structure to understand the database schema:

Search codebase for 'CREATE TABLE.*audit'

complete_mariadb_schema.sql 20 - 50

Perfect! Now I have a good understanding of the audit table structure. Let me create a comprehensive Audit Logs API implementation with all the requested endpoints:

```
import express from 'express';
import { db } from '../index.js';
import { RowDataPacket } from 
'mysql2';
import { auditMiddleware, 
AuditableRequest } from '../
middleware/auditMiddleware.js';

const router = express.Router();

// Apply audit middleware
router.use(auditMiddleware);

// Interface for audit log record
interface AuditLog {
  audit_id: number;
  emp_id: string;
  date: string;
  status: string;
  table_name: string;
  record_id: string;
  action_type: 'CREATE' | 
  'UPDATE' | 'DELETE' | 'LOGIN' | 
  'LOGOUT';
  old_values: string | null;
  new_values: string | null;
  created_at: string;
}

// Helper function to build WHERE 
clause for filtering
function buildWhereClause(filters: 
any): { whereClause: string; 
params: any[] } {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (filters.table_name) {
    whereClause += ' AND table_name 
    = ?';
    params.push(filters.table_name);
  }

  if (filters.action_type) {
    whereClause += ' AND 
    action_type = ?';
    params.push(filters.
    action_type);
  }

  if (filters.emp_id) {
    whereClause += ' AND emp_id = ?
    ';
    params.push(filters.emp_id);
  }

  if (filters.start_date) {
    whereClause += ' AND created_at 
    >= ?';
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    whereClause += ' AND created_at 
    <= ?';
    params.push(filters.end_date);
  }

  if (filters.search) {
    whereClause += ' AND (emp_id 
    LIKE ? OR status LIKE ? OR 
    table_name LIKE ?)';
    const searchPattern = `%$
    {filters.search}%`;
    params.push(searchPattern, 
    searchPattern, searchPattern);
  }

  return { whereClause, params };
}

// Helper function to format CSV 
data
function formatCSV(data: any[]): 
string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data
  [0]);
  const csvHeaders = headers.join(',
  ');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in 
      quotes if contains comma or 
      quote
      if (typeof value === 
      'string' && (value.includes(',
      ') || value.includes('"'))) {
        return `"${value.replace(/"/
        g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].
  join('\n');
}

// 1. GET /api/audit - Get audit 
logs with filtering
router.get('/', async (req: 
AuditableRequest, res) => {
  try {
    const { 
      table_name, 
      action_type, 
      emp_id, 
      start_date, 
      end_date, 
      limit = 100, 
      offset = 0,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const filters = { table_name, 
    action_type, emp_id, 
    start_date, end_date, search };
    const { whereClause, params } = 
    buildWhereClause(filters);

    // Validate sort parameters
    const validSortColumns = 
    ['audit_id', 'emp_id', 'date', 
    'status', 'table_name', 
    'action_type', 'created_at'];
    const validSortOrders = ['ASC', 
    'DESC'];
    
    const sortColumn = 
    validSortColumns.includes
    (sort_by as string) ? sort_by : 
    'created_at';
    const sortDirection = 
    validSortOrders.includes
    ((sort_order as string).
    toUpperCase()) ? 
      (sort_order as string).
      toUpperCase() : 'DESC';

    const query = `
      SELECT 
        audit_id,
        emp_id,
        date,
        status,
        table_name,
        record_id,
        action_type,
        old_values,
        new_values,
        created_at
      FROM audit 
      ${whereClause}
      ORDER BY ${sortColumn} $
      {sortDirection}
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit as 
    string), parseInt(offset as 
    string));
    const [auditLogs] = await db.
    execute<RowDataPacket[]>(query, 
    params);

    // Get total count for 
    pagination
    const countQuery = `SELECT COUNT
    (*) as total FROM audit $
    {whereClause}`;
    const [countResult] = await db.
    execute<RowDataPacket[]>
    (countQuery, params.slice(0, 
    -2));

    const totalRecords = countResult
    [0].total;
    const totalPages = Math.ceil
    (totalRecords / parseInt(limit 
    as string));

    res.json({
      audit_logs: auditLogs,
      pagination: {
        total: totalRecords,
        limit: parseInt(limit as 
        string),
        offset: parseInt(offset as 
        string),
        current_page: Math.floor
        (parseInt(offset as 
        string) / parseInt(limit as 
        string)) + 1,
        total_pages: totalPages,
        has_next: parseInt(offset 
        as string) + parseInt(limit 
        as string) < totalRecords,
        has_prev: parseInt(offset 
        as string) > 0
      },
      filters: {
        table_name: table_name || 
        null,
        action_type: action_type || 
        null,
        emp_id: emp_id || null,
        start_date: start_date || 
        null,
        end_date: end_date || null,
        search: search || null,
        sort_by: sortColumn,
        sort_order: sortDirection
      }
    });

  } catch (error) {
    console.error('Error fetching 
    audit logs:', error);
    res.status(500).json({ error: 
    'Failed to fetch audit logs' });
  }
});

// 2. GET /api/audit/stats - Get 
comprehensive statistics
router.get('/stats', async (req: 
AuditableRequest, res) => {
  try {
    // Total logs
    const [totalLogs] = await db.
    execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count 
      FROM audit'
    );

    // Today's logs
    const [todayLogs] = await db.
    execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count 
      FROM audit WHERE DATE
      (created_at) = CURDATE()'
    );

    // Weekly logs
    const [weekLogs] = await db.
    execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count 
      FROM audit WHERE created_at 
      >= DATE_SUB(NOW(), INTERVAL 7 
      DAY)'
    );

    // Action statistics
    const [actionStats] = await db.
    execute<RowDataPacket[]>(
      'SELECT action_type, COUNT(*) 
      as count FROM audit GROUP BY 
      action_type ORDER BY count 
      DESC'
    );

    // Table statistics
    const [tableStats] = await db.
    execute<RowDataPacket[]>(
      'SELECT table_name, COUNT(*) 
      as count FROM audit WHERE 
      table_name IS NOT NULL GROUP 
      BY table_name ORDER BY count 
      DESC'
    );

    // User statistics
    const [userStats] = await db.
    execute<RowDataPacket[]>(
      'SELECT emp_id, COUNT(*) as 
      count FROM audit GROUP BY 
      emp_id ORDER BY count DESC 
      LIMIT 10'
    );

    // Hourly statistics (last 24 
    hours)
    const [hourlyStats] = await db.
    execute<RowDataPacket[]>(
      `SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as count
       FROM audit 
       WHERE created_at >= DATE_SUB
       (NOW(), INTERVAL 24 HOUR)
       GROUP BY HOUR(created_at)
       ORDER BY hour`
    );

    // Daily statistics (last 30 
    days)
    const [dailyStats] = await db.
    execute<RowDataPacket[]>(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
       FROM audit 
       WHERE created_at >= DATE_SUB
       (NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    res.json({
      total_logs: totalLogs[0].
      count,
      today_logs: todayLogs[0].
      count,
      weekly_logs: weekLogs[0].
      count,
      action_stats: actionStats,
      table_stats: tableStats,
      user_stats: userStats,
      hourly_stats: hourlyStats,
      daily_stats: dailyStats
    });

  } catch (error) {
    console.error('Error fetching 
    audit statistics:', error);
    res.status(500).json({ error: 
    'Failed to fetch audit 
    statistics' });
  }
});

// 3. GET /api/audit/record/:table/
:id - Get audit history for 
specific record
router.get('/record/:table/:id', 
async (req: AuditableRequest, res) 
=> {
  try {
    const { table, id } = req.
    params;

    if (!table || !id) {
      return res.status(400).json({ 
      error: 'Table name and record 
      ID are required' });
    }

    const [auditLogs] = await db.
    execute<RowDataPacket[]>(
      `SELECT 
        audit_id,
        emp_id,
        date,
        status,
        action_type,
        old_values,
        new_values,
        created_at
       FROM audit 
       WHERE table_name = ? AND 
       record_id = ?
       ORDER BY created_at DESC`,
      [table, id]
    );

    res.json({
      table_name: table,
      record_id: id,
      audit_history: auditLogs,
      total_entries: auditLogs.
      length
    });

  } catch (error) {
    console.error('Error fetching 
    record audit logs:', error);
    res.status(500).json({ error: 
    'Failed to fetch record audit 
    history' });
  }
});

// 4. GET /api/audit/user/:username 
- Get user activity logs
router.get('/user/:username', async 
(req: AuditableRequest, res) => {
  try {
    const { username } = req.params;
    const { limit = 50, offset = 
    0 } = req.query;

    if (!username) {
      return res.status(400).json({ 
      error: 'Username is 
      required' });
    }

    const [userLogs] = await db.
    execute<RowDataPacket[]>(
      `SELECT 
        audit_id,
        date,
        status,
        table_name,
        record_id,
        action_type,
        created_at
       FROM audit 
       WHERE emp_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [username, parseInt(limit as 
      string), parseInt(offset as 
      string)]
    );

    const [countResult] = await db.
    execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total 
      FROM audit WHERE emp_id = ?',
      [username]
    );

    const totalRecords = countResult
    [0].total;

    res.json({
      username: username,
      user_logs: userLogs,
      pagination: {
        total: totalRecords,
        limit: parseInt(limit as 
        string),
        offset: parseInt(offset as 
        string),
        current_page: Math.floor
        (parseInt(offset as 
        string) / parseInt(limit as 
        string)) + 1,
        total_pages: Math.ceil
        (totalRecords / parseInt
        (limit as string)),
        has_next: parseInt(offset 
        as string) + parseInt(limit 
        as string) < totalRecords,
        has_prev: parseInt(offset 
        as string) > 0
      }
    });

  } catch (error) {
    console.error('Error fetching 
    user audit logs:', error);
    res.status(500).json({ error: 
    'Failed to fetch user activity 
    logs' });
  }
});

// 5. GET /api/audit/analytics/
timeline - Get audit logs with 
time-based aggregation
router.get('/analytics/timeline', 
async (req: AuditableRequest, res) 
=> {
  try {
    const { 
      start_date, 
      end_date, 
      group_by = 'day' 
    } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ 
        error: 'start_date and 
        end_date are required',
        example: '?
        start_date=2024-01-01&
        end_date=2024-01-31&
        group_by=day'
      });
    }

    const validGroupBy = ['hour', 
    'day', 'week', 'month'];
    if (!validGroupBy.includes
    (group_by as string)) {
      return res.status(400).json({ 
        error: 'Invalid group_by 
        parameter',
        valid_values: validGroupBy
      });
    }

    let dateFormat: string;
    let groupByClause: string;

    switch (group_by) {
      case 'hour':
        dateFormat = '%Y-%m-%d 
        %H:00:00';
        groupByClause = 'DATE_FORMAT
        (created_at, "%Y-%m-%d 
        %H:00:00")';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        groupByClause = 'DATE
        (created_at)';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        groupByClause = 'YEARWEEK
        (created_at)';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        groupByClause = 'DATE_FORMAT
        (created_at, "%Y-%m")';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        groupByClause = 'DATE
        (created_at)';
    }

    const [timelineData] = await db.
    execute<RowDataPacket[]>(
      `SELECT 
        ${groupByClause} as 
        time_period,
        COUNT(*) as total_logs,
        COUNT(CASE WHEN action_type 
        = 'CREATE' THEN 1 END) as 
        create_count,
        COUNT(CASE WHEN action_type 
        = 'UPDATE' THEN 1 END) as 
        update_count,
        COUNT(CASE WHEN action_type 
        = 'DELETE' THEN 1 END) as 
        delete_count,
        COUNT(CASE WHEN action_type 
        = 'LOGIN' THEN 1 END) as 
        login_count,
        COUNT(CASE WHEN action_type 
        = 'LOGOUT' THEN 1 END) as 
        logout_count,
        COUNT(DISTINCT emp_id) as 
        unique_users,
        COUNT(DISTINCT table_name) 
        as unique_tables
       FROM audit 
       WHERE created_at >= ? AND 
       created_at <= ?
       GROUP BY ${groupByClause}
       ORDER BY time_period`,
      [start_date, end_date]
    );

    res.json({
      timeline_data: timelineData,
      parameters: {
        start_date,
        end_date,
        group_by,
        total_periods: timelineData.
        length
      }
    });

  } catch (error) {
    console.error('Error fetching 
    timeline analytics:', error);
    res.status(500).json({ error: 
    'Failed to fetch timeline 
    analytics' });
  }
});

// 6. GET /api/audit/export - 
Export audit logs as CSV
router.get('/export', async (req: 
AuditableRequest, res) => {
  try {
    const { 
      table_name, 
      action_type, 
      emp_id, 
      start_date, 
      end_date,
      search
    } = req.query;

    const filters = { table_name, 
    action_type, emp_id, 
    start_date, end_date, search };
    const { whereClause, params } = 
    buildWhereClause(filters);

    const query = `
      SELECT 
        audit_id,
        emp_id,
        date,
        status,
        table_name,
        record_id,
        action_type,
        created_at
      FROM audit 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10000
    `;
    
    const [auditLogs] = await db.
    execute<RowDataPacket[]>(query, 
    params);

    if (auditLogs.length === 0) {
      return res.status(404).json({ 
      error: 'No audit logs found 
      for export' });
    }

    const csvData = formatCSV
    (auditLogs);
    const filename = `audit_logs_$
    {new Date().toISOString().split
    ('T')[0]}.csv`;

    res.setHeader('Content-Type', 
    'text/csv');
    res.setHeader
    ('Content-Disposition', 
    `attachment; filename="$
    {filename}"`);
    res.send(csvData);

  } catch (error) {
    console.error('Error exporting 
    audit logs:', error);
    res.status(500).json({ error: 
    'Failed to export audit 
    logs' });
  }
});

// 7. POST /api/audit - Create 
manual audit log entry
router.post('/', async (req: 
AuditableRequest, res) => {
  try {
    const { 
      table_name, 
      record_id, 
      action_type, 
      status, 
      old_values, 
      new_values 
    } = req.body;

    // Validate required fields
    if (!table_name || 
    !record_id || !action_type || 
    !status) {
      return res.status(400).json({ 
        error: 'Required fields are 
        missing',
        required_fields: 
        ['table_name', 'record_id', 
        'action_type', 'status']
      });
    }

    // Validate action_type
    const validActionTypes = 
    ['CREATE', 'UPDATE', 'DELETE', 
    'LOGIN', 'LOGOUT'];
    if (!validActionTypes.includes
    (action_type)) {
      return res.status(400).json({ 
        error: 'Invalid 
        action_type',
        valid_values: 
        validActionTypes
      });
    }

    // Validate JSON fields if 
    provided
    if (old_values) {
      try {
        JSON.parse(old_values);
      } catch (e) {
        return res.status(400).json
        ({ error: 'old_values must 
        be valid JSON' });
      }
    }

    if (new_values) {
      try {
        JSON.parse(new_values);
      } catch (e) {
        return res.status(400).json
        ({ error: 'new_values must 
        be valid JSON' });
      }
    }

    const emp_id = req.user?.
    username || 'system';
    const date = new Date().
    toISOString();

    const query = `
      INSERT INTO audit (
        emp_id, date, status, 
        table_name, record_id, 
        action_type, old_values, 
        new_values
      ) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.
    execute(query, [
      emp_id,
      date,
      status,
      table_name,
      record_id,
      action_type,
      old_values || null,
      new_values || null
    ]);

    const insertId = (result as 
    any).insertId;

    // Fetch the created audit log
    const [newAuditLog] = await db.
    execute<RowDataPacket[]>(
      'SELECT * FROM audit WHERE 
      audit_id = ?',
      [insertId]
    );

    res.status(201).json({
      message: 'Audit log entry 
      created successfully',
      audit_log: newAuditLog[0]
    });

  } catch (error) {
    console.error('Error creating 
    audit log entry:', error);
    res.status(500).json({ error: 
    'Failed to create audit log 
    entry' });
  }
});

// 8. DELETE /api/audit/cleanup - 
Clean up old audit logs
router.delete('/cleanup', async 
(req: AuditableRequest, res) => {
  try {
    const { retention_days = 365 } 
    = req.query;

    const retentionDays = parseInt
    (retention_days as string);
    
    if (isNaN(retentionDays) || 
    retentionDays < 1) {
      return res.status(400).json({ 
        error: 'retention_days must 
        be a positive number',
        example: '?
        retention_days=365'
      });
    }

    // First, get count of logs to 
    be deleted
    const [countResult] = await db.
    execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count 
      FROM audit WHERE created_at < 
      DATE_SUB(NOW(), INTERVAL ? 
      DAY)',
      [retentionDays]
    );

    const logsToDelete = countResult
    [0].count;

    if (logsToDelete === 0) {
      return res.json({
        message: 'No audit logs 
        found older than the 
        retention period',
        retention_days: 
        retentionDays,
        logs_deleted: 0
      });
    }

    // Delete old audit logs
    const [deleteResult] = await db.
    execute(
      'DELETE FROM audit WHERE 
      created_at < DATE_SUB(NOW(), 
      INTERVAL ? DAY)',
      [retentionDays]
    );

    const logsDeleted = 
    (deleteResult as any).
    affectedRows;

    res.json({
      message: 'Audit logs cleanup 
      completed successfully',
      retention_days: retentionDays,
      logs_deleted: logsDeleted,
      cleanup_date: new Date().
      toISOString()
    });

  } catch (error) {
    console.error('Error cleaning 
    up audit logs:', error);
    res.status(500).json({ error: 
    'Failed to cleanup audit 
    logs' });
  }
});

export default router;
```
Now let me create comprehensive API documentation for the Audit Logs service:

```
# Audit Logs API Documentation

## Overview
The Audit Logs API provides 
comprehensive tracking and 
management of all system 
activities, user actions, and data 
changes. It offers powerful 
filtering, analytics, and export 
capabilities for compliance and 
monitoring purposes.

## Base URL
```
http://localhost:5000/api/audit


## Table Structure
The audit table contains the following fields:
- `audit_id`: Unique identifier (auto-increment)
- `emp_id`: User/employee identifier
- `date`: Legacy date field (string format)
- `status`: Status description of the action
- `table_name`: Name of the affected table
- `record_id`: ID of the affected record
- `action_type`: Type of action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
- `old_values`: JSON string of previous values
- `new_values`: JSON string of new values
- `created_at`: Timestamp of when the audit log was created

## API Endpoints

### 1. Get Audit Logs with Filtering
**GET** `/api/audit`

Retrieve audit logs with comprehensive filtering and pagination options.

#### Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `table_name` | string | Filter by table name | `customers` |
| `action_type` | string | Filter by action type | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT` |
| `emp_id` | string | Filter by employee/user ID | `john_doe` |
| `start_date` | string | Start date filter (ISO format) | `2024-01-01` |
| `end_date` | string | End date filter (ISO format) | `2024-01-31` |
| `limit` | number | Number of records per page | `100` (default) |
| `offset` | number | Number of records to skip | `0` (default) |
| `search` | string | Search in emp_id, status, table_name | `customer` |
| `sort_by` | string | Sort column | `created_at` (default) |
| `sort_order` | string | Sort direction | `DESC` (default), `ASC` |

#### Response
```json
{
  "audit_logs": [
    {
      "audit_id": 1,
      "emp_id": "john_doe",
      "date": "2024-01-15 10:30:00",
      "status": "Customer created successfully",
      "table_name": "customers",
      "record_id": "123",
      "action_type": "CREATE",
      "old_values": null,
      "new_values": "{\"name\":\"John Doe\",\"phone\":\"123456789\"}",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1500,
    "limit": 100,
    "offset": 0,
    "current_page": 1,
    "total_pages": 15,
    "has_next": true,
    "has_prev": false
  },
  "filters": {
    "table_name": null,
    "action_type": null,
    "emp_id": null,
    "start_date": null,
    "end_date": null,
    "search": null,
    "sort_by": "created_at",
    "sort_order": "DESC"
  }
}
```

### 2. Get Comprehensive Statistics
**GET** `/api/audit/stats`

Get detailed statistics about audit logs including totals, trends, and breakdowns.

#### Response
```json
{
  "total_logs": 15000,
  "today_logs": 45,
  "weekly_logs": 320,
  "action_stats": [
    {"action_type": "CREATE", "count": 5000},
    {"action_type": "UPDATE", "count": 7000},
    {"action_type": "DELETE", "count": 1000},
    {"action_type": "LOGIN", "count": 1500},
    {"action_type": "LOGOUT", "count": 500}
  ],
  "table_stats": [
    {"table_name": "customers", "count": 3000},
    {"table_name": "orders", "count": 8000},
    {"table_name": "payments", "count": 4000}
  ],
  "user_stats": [
    {"emp_id": "john_doe", "count": 1200},
    {"emp_id": "jane_smith", "count": 800}
  ],
  "hourly_stats": [
    {"hour": 9, "count": 15},
    {"hour": 10, "count": 25},
    {"hour": 11, "count": 30}
  ],
  "daily_stats": [
    {"date": "2024-01-15", "count": 120},
    {"date": "2024-01-16", "count": 95}
  ]
}
```

### 3. Get Audit History for Specific Record
**GET** `/api/audit/record/:table/:id`

Retrieve complete audit history for a specific record.

#### Parameters
- `table`: Table name (e.g., `customers`)
- `id`: Record ID (e.g., `123`)

#### Response
```json
{
  "table_name": "customers",
  "record_id": "123",
  "audit_history": [
    {
      "audit_id": 1,
      "emp_id": "john_doe",
      "date": "2024-01-15 10:30:00",
      "status": "Customer updated",
      "action_type": "UPDATE",
      "old_values": "{\"phone\":\"123456789\"}",
      "new_values": "{\"phone\":\"987654321\"}",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total_entries": 5
}
```

### 4. Get User Activity Logs
**GET** `/api/audit/user/:username`

Get all audit logs for a specific user with pagination.

#### Parameters
- `username`: User identifier

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | number | Records per page | `50` |
| `offset` | number | Records to skip | `0` |

#### Response
```json
{
  "username": "john_doe",
  "user_logs": [
    {
      "audit_id": 1,
      "date": "2024-01-15 10:30:00",
      "status": "Customer created",
      "table_name": "customers",
      "record_id": "123",
      "action_type": "CREATE",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "current_page": 1,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### 5. Get Timeline Analytics
**GET** `/api/audit/analytics/timeline`

Get time-based aggregation of audit logs for analytics and reporting.

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `start_date` | string | Yes | Start date (ISO format) | `2024-01-01` |
| `end_date` | string | Yes | End date (ISO format) | `2024-01-31` |
| `group_by` | string | No | Grouping interval | `day` (default), `hour`, `week`, `month` |

#### Response
```json
{
  "timeline_data": [
    {
      "time_period": "2024-01-15",
      "total_logs": 120,
      "create_count": 45,
      "update_count": 60,
      "delete_count": 10,
      "login_count": 5,
      "logout_count": 0,
      "unique_users": 8,
      "unique_tables": 4
    }
  ],
  "parameters": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "group_by": "day",
    "total_periods": 31
  }
}
```

### 6. Export Audit Logs as CSV
**GET** `/api/audit/export`

Export filtered audit logs as a CSV file for external analysis.

#### Query Parameters
Same filtering parameters as the main GET endpoint:
- `table_name`, `action_type`, `emp_id`, `start_date`, `end_date`, `search`

#### Response
Returns a CSV file with headers:



### 7. Create Manual Audit Log Entry
**POST** `/api/audit`

Create a manual audit log entry for custom tracking or system events.

#### Request Body
```json
{
  "table_name": "customers",
  "record_id": "123",
  "action_type": "UPDATE",
  "status": "Customer information updated manually",
  "old_values": "{\"phone\":\"123456789\"}",
  "new_values": "{\"phone\":\"987654321\"}"
}
```

#### Required Fields
- `table_name`: Name of the affected table
- `record_id`: ID of the affected record
- `action_type`: One of: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
- `status`: Description of the action

#### Optional Fields
- `old_values`: JSON string of previous values
- `new_values`: JSON string of new values

#### Response
```json
{
  "message": "Audit log entry created successfully",
  "audit_log": {
    "audit_id": 15001,
    "emp_id": "current_user",
    "date": "2024-01-15T10:30:00.000Z",
    "status": "Customer information updated manually",
    "table_name": "customers",
    "record_id": "123",
    "action_type": "UPDATE",
    "old_values": "{\"phone\":\"123456789\"}",
    "new_values": "{\"phone\":\"987654321\"}",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 8. Clean Up Old Audit Logs
**DELETE** `/api/audit/cleanup`

Remove audit logs older than the specified retention period.

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `retention_days` | number | Days to retain logs | `365` |

#### Response
```json
{
  "message": "Audit logs cleanup completed successfully",
  "retention_days": 365,
  "logs_deleted": 2500,
  "cleanup_date": "2024-01-15T10:30:00.000Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created (for POST requests)
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (no records found)
- `500`: Internal Server Error

## Data Validation

### Action Types
Valid action types are:
- `CREATE`: Record creation
- `UPDATE`: Record modification
- `DELETE`: Record deletion
- `LOGIN`: User login
- `LOGOUT`: User logout

### Date Formats
- Use ISO 8601 format for dates: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`
- Timezone: UTC is recommended

### JSON Fields
- `old_values` and `new_values` must be valid JSON strings
- Use `null` for empty values

## Usage Examples

### Get recent audit logs
```bash
curl "http://localhost:5000/api/audit?limit=10&sort_order=DESC"
```

### Get logs for specific table
```bash
curl "http://localhost:5000/api/audit?table_name=customers&limit=50"
```

### Get user activity
```bash
curl "http://localhost:5000/api/audit/user/john_doe?limit=20"
```

### Export logs as CSV
```bash
curl "http://localhost:5000/api/audit/export?start_date=2024-01-01&end_date=2024-01-31" -o audit_logs.csv
```

### Create manual audit entry
```bash
curl -X POST "http://localhost:5000/api/audit" \
  -H "Content-Type: application/json" \
  -d '{
    "table_name": "customers",
    "record_id": "123",
    "action_type": "UPDATE",
    "status": "Manual update via API"
  }'
```

### Clean up old logs
```bash
curl -X DELETE "http://localhost:5000/api/audit/cleanup?retention_days=180"
```

## Security Considerations

1. **Authentication**: All endpoints require valid authentication
2. **Authorization**: Users can only access logs they have permission to view
3. **Data Retention**: Implement appropriate retention policies
4. **Sensitive Data**: Avoid logging sensitive information in old_values/new_values
5. **Rate Limiting**: Consider implementing rate limiting for export endpoints

## Performance Tips

1. **Indexing**: Ensure proper indexes on frequently queried columns
2. **Pagination**: Always use pagination for large datasets
3. **Date Ranges**: Use specific date ranges to limit query scope
4. **Export Limits**: CSV exports are limited to 10,000 records
5. **Cleanup**: Regularly clean up old audit logs to maintain performance