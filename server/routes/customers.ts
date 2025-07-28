import express from 'express';
import { db } from '../index';
import { auditMiddleware, addAuditFieldsForInsert, addAuditFieldsForUpdate, addAuditFieldsForDelete, AuditableRequest } from '../middleware/auditMiddleware';

const router = express.Router();

// Apply audit middleware to all routes
router.use(auditMiddleware);

// GET latest 5 customers (optimized for performance) with audit information
router.get('/', async (req: AuditableRequest, res) => {
  try {
    const query = `
      SELECT 
        c.customer_id,
        c.customer_name,
        c.phone_number,
        c.email,
        c.address,
        c.registration_date,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at,
        c.created_by,
        c.updated_by,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      WHERE c.deleted_at IS NULL
      GROUP BY c.customer_id
      ORDER BY c.registration_date DESC, c.created_at DESC
      LIMIT 5
    `;
    
    const [customers] = await db.execute(query);
    res.json({
      customers,
      message: 'Latest 5 customers fetched successfully',
      total_shown: Array.isArray(customers) ? customers.length : 0
    });
  } catch (error) {
    console.error('Error fetching latest customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET all customers (use with caution - for admin purposes)
router.get('/all', async (req: AuditableRequest, res) => {
  try {
    const query = `
      SELECT 
        c.customer_id,
        c.customer_name,
        c.phone_number,
        c.email,
        c.address,
        c.registration_date,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at,
        c.created_by,
        c.updated_by,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      WHERE c.deleted_at IS NULL
      GROUP BY c.customer_id
      ORDER BY c.customer_name ASC
    `;
    
    const [customers] = await db.execute(query);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching all customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET paginated customers (better performance for large datasets)
router.get('/paginated', async (req: AuditableRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM customers WHERE deleted_at IS NULL'
    );
    const totalCustomers = (countResult as any)[0].total;

    const query = `
      SELECT 
        c.customer_id,
        c.customer_name,
        c.phone_number,
        c.email,
        c.address,
        c.registration_date,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at,
        c.created_by,
        c.updated_by,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      WHERE c.deleted_at IS NULL
      GROUP BY c.customer_id
      ORDER BY c.registration_date DESC, c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [customers] = await db.execute(query, [limit, offset]);
    
    res.json({
      customers,
      pagination: {
        current_page: page,
        per_page: limit,
        total: totalCustomers,
        total_pages: Math.ceil(totalCustomers / limit),
        has_next: page < Math.ceil(totalCustomers / limit),
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching paginated customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET customer by ID with audit information
router.get('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        c.customer_id,
        c.customer_name,
        c.phone_number,
        c.email,
        c.address,
        c.registration_date,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at,
        c.created_by,
        c.updated_by,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      WHERE c.customer_id = ? AND c.deleted_at IS NULL
      GROUP BY c.customer_id
    `;
    
    const [customers] = await db.execute(query, [id]);
    
    if (Array.isArray(customers) && customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customers[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST create new customer with audit logging
router.post('/', async (req: AuditableRequest, res) => {
  try {
    const { customer_name, phone_number, email, address, notes } = req.body;
    
    // Validate required fields
    if (!customer_name || !phone_number) {
      return res.status(400).json({ 
        error: 'Customer full name and phone number are required',
        required_fields: ['customer_name', 'phone_number']
      });
    }

    // Validate customer name (should be full name)
    if (customer_name.trim().split(' ').length < 2) {
      return res.status(400).json({ 
        error: 'Please provide customer full name (first and last name)',
        example: 'Ahmed Mohamed Ali'
      });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9+\-\s()]{9,15}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ 
        error: 'Please provide a valid phone number',
        format: 'Phone number should be 9-15 digits'
      });
    }

    // Check if phone number already exists
    const [existingCustomer] = await db.execute(
      'SELECT customer_id FROM customers WHERE phone_number = ? AND deleted_at IS NULL',
      [phone_number]
    );

    if (Array.isArray(existingCustomer) && existingCustomer.length > 0) {
      return res.status(409).json({ 
        error: 'A customer with this phone number already exists',
        existing_customer_id: (existingCustomer[0] as any).customer_id
      });
    }

    const customerData = addAuditFieldsForInsert({
      customer_name: customer_name.trim(),
      phone_number: phone_number.trim(),
      email: email?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
      status: 'active'
    }, req.auditUser || 'system');

    const query = `
      INSERT INTO customers (
        customer_name, phone_number, email, address, notes, status,
        created_at, updated_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      customerData.customer_name,
      customerData.phone_number,
      customerData.email,
      customerData.address,
      customerData.notes,
      customerData.status,
      customerData.created_at,
      customerData.updated_at,
      customerData.created_by,
      customerData.updated_by
    ]);
    
    // Log to audit table
    const auditQuery = `
      INSERT INTO audit (emp_id, date, status, table_name, record_id, action_type, new_values)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.execute(auditQuery, [
      req.auditUser,
      new Date().toISOString().slice(0, 19).replace('T', ' '),
      `Created Customer: ${customerData.customer_name}`,
      'customers',
      (result as any).insertId,
      'CREATE',
      JSON.stringify(customerData)
    ]);
    
    res.status(201).json({ 
      message: 'Customer created successfully', 
      customer_id: (result as any).insertId,
      customer_name: customerData.customer_name,
      phone_number: customerData.phone_number
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT update customer with audit logging
router.put('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { customer_name, phone_number, email, address, notes, status } = req.body;
    
    // Get old values for audit
    const [oldCustomer] = await db.execute(
      'SELECT * FROM customers WHERE customer_id = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (!Array.isArray(oldCustomer) || oldCustomer.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updateData = addAuditFieldsForUpdate({
      customer_name,
      phone_number,
      email,
      address,
      notes,
      status
    }, req.auditUser || 'system');

    const query = `
      UPDATE customers 
      SET customer_name = ?, phone_number = ?, email = ?, address = ?, 
          notes = ?, status = ?, updated_at = ?, updated_by = ?
      WHERE customer_id = ? AND deleted_at IS NULL
    `;
    
    await db.execute(query, [
      updateData.customer_name,
      updateData.phone_number,
      updateData.email,
      updateData.address,
      updateData.notes,
      updateData.status,
      updateData.updated_at,
      updateData.updated_by,
      id
    ]);
    
    // Log to audit table
    const auditQuery = `
      INSERT INTO audit (emp_id, date, status, table_name, record_id, action_type, old_values, new_values)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.execute(auditQuery, [
      req.auditUser,
      new Date().toISOString().slice(0, 19).replace('T', ' '),
      'Updated a Customer',
      'customers',
      id,
      'UPDATE',
      JSON.stringify(oldCustomer[0]),
      JSON.stringify(updateData)
    ]);
    
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE customer (soft delete) with audit logging
router.delete('/:id', async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    
    // Get customer data before deletion for audit
    const [customer] = await db.execute(
      'SELECT * FROM customers WHERE customer_id = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (!Array.isArray(customer) || customer.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const deleteData = addAuditFieldsForDelete(req.auditUser || 'system');

    const query = `
      UPDATE customers 
      SET deleted_at = ?, deleted_by = ?
      WHERE customer_id = ? AND deleted_at IS NULL
    `;
    
    await db.execute(query, [deleteData.deleted_at, deleteData.deleted_by, id]);
    
    // Log to audit table
    const auditQuery = `
      INSERT INTO audit (emp_id, date, status, table_name, record_id, action_type, old_values)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.execute(auditQuery, [
      req.auditUser,
      new Date().toISOString().slice(0, 19).replace('T', ' '),
      'Deleted a Customer',
      'customers',
      id,
      'DELETE',
      JSON.stringify(customer[0])
    ]);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// GET search customers with audit information
router.get('/search/:query', async (req: AuditableRequest, res) => {
  try {
    const { query } = req.params;
    const searchQuery = `
      SELECT 
        c.customer_id,
        c.customer_name,
        c.phone_number,
        c.email,
        c.address,
        c.registration_date,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at,
        c.created_by,
        c.updated_by,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      WHERE (c.customer_name LIKE ? OR c.phone_number LIKE ?) 
        AND c.deleted_at IS NULL
      GROUP BY c.customer_id
      ORDER BY c.customer_name ASC
    `;
    
    const searchTerm = `%${query}%`;
    const [customers] = await db.execute(searchQuery, [searchTerm, searchTerm]);
    res.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

// Advanced search customers by multiple criteria
router.get('/search', async (req: AuditableRequest, res) => {
  try {
    const { 
      query, 
      phone, 
      order_id, 
      name, 
      search_type = 'all' 
    } = req.query;

    // Validate that at least one search parameter is provided
    if (!query && !phone && !order_id && !name) {
      return res.status(400).json({ 
        error: 'At least one search parameter is required',
        available_parameters: ['query', 'phone', 'order_id', 'name'],
        examples: [
          '/customers/search?query=ahmed',
          '/customers/search?phone=0927802065',
          '/customers/search?order_id=123',
          '/customers/search?name=ahmed mohamed'
        ]
      });
    }

    let searchQuery = `
      SELECT DISTINCT
        c.customer_id,
        c.customer_name,
        c.phone_number,
        c.email,
        c.address,
        c.registration_date,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at,
        c.created_by,
        c.updated_by,
        COUNT(DISTINCT o.order_id) as total_orders,
        COALESCE(SUM(DISTINCT o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date,
        GROUP_CONCAT(DISTINCT o.order_number ORDER BY o.order_date DESC SEPARATOR ', ') as recent_orders
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      WHERE c.deleted_at IS NULL
    `;

    const searchParams: any[] = [];
    const conditions: string[] = [];

    // General query search (searches in name, phone, and email)
    if (query) {
      const generalSearch = `(
        c.customer_name LIKE ? OR 
        c.phone_number LIKE ? OR 
        c.email LIKE ?
      )`;
      conditions.push(generalSearch);
      const queryTerm = `%${query}%`;
      searchParams.push(queryTerm, queryTerm, queryTerm);
    }

    // Specific phone number search
    if (phone) {
      conditions.push('c.phone_number LIKE ?');
      searchParams.push(`%${phone}%`);
    }

    // Specific name search
    if (name) {
      conditions.push('c.customer_name LIKE ?');
      searchParams.push(`%${name}%`);
    }

    // Order ID search (find customer by their order)
    if (order_id) {
      searchQuery = `
        SELECT DISTINCT
          c.customer_id,
          c.customer_name,
          c.phone_number,
          c.email,
          c.address,
          c.registration_date,
          c.status,
          c.notes,
          c.created_at,
          c.updated_at,
          c.created_by,
          c.updated_by,
          COUNT(DISTINCT o.order_id) as total_orders,
          COALESCE(SUM(DISTINCT o.total_amount), 0) as total_spent,
          MAX(o.order_date) as last_order_date,
          GROUP_CONCAT(DISTINCT o.order_number ORDER BY o.order_date DESC SEPARATOR ', ') as recent_orders,
          o2.order_number as matched_order,
          o2.order_date as matched_order_date,
          o2.total_amount as matched_order_amount
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id
        INNER JOIN orders o2 ON c.customer_id = o2.customer_id
        WHERE c.deleted_at IS NULL AND (o2.order_id = ? OR o2.order_number LIKE ?)
      `;
      searchParams.push(order_id, `%${order_id}%`);
    }

    // Add conditions to query if not searching by order_id
    if (!order_id && conditions.length > 0) {
      if (search_type === 'any') {
        searchQuery += ` AND (${conditions.join(' OR ')})`;
      } else {
        searchQuery += ` AND (${conditions.join(' AND ')})`;
      }
    }

    // Add GROUP BY and ORDER BY
    searchQuery += `
      GROUP BY c.customer_id
      ORDER BY 
        CASE 
          WHEN c.customer_name LIKE ? THEN 1
          WHEN c.phone_number LIKE ? THEN 2
          ELSE 3
        END,
        c.customer_name ASC
      LIMIT 50
    `;

    // Add parameters for ORDER BY relevance
    const firstParam = query || phone || name || '';
    const relevanceParam = `%${firstParam}%`;
    searchParams.push(relevanceParam, relevanceParam);

    const [customers] = await db.execute(searchQuery, searchParams);

    // Log search activity
    await db.execute(
      'INSERT INTO audit (emp_id, date, status, action_type, table_name) VALUES (?, ?, ?, ?, ?)',
      [
        req.auditUser,
        new Date().toISOString().slice(0, 19).replace('T', ' '),
        `Customer Search: ${JSON.stringify({ query, phone, order_id, name })}`,
        'CREATE',
        'customers'
      ]
    );

    res.json({
      customers,
      search_criteria: { query, phone, order_id, name, search_type },
      total_results: Array.isArray(customers) ? customers.length : 0,
      message: `Found ${Array.isArray(customers) ? customers.length : 0} customer(s)`
    });

  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

// Quick search by phone number (exact match with flexible formatting)
router.get('/search/phone/:phone', async (req: AuditableRequest, res) => {
  try {
    const { phone } = req.params;
    
    // Normalize phone number by removing common prefixes and formatting
    const normalizedPhone = phone.replace(/^0+/, ''); // Remove leading zeros
    const phoneWithZero = '0' + normalizedPhone; // Add leading zero
    
    const query = `
      SELECT 
        c.customer_id,
        c.customer_name,
        c.phone_number,
        c.email,
        c.address,
        c.registration_date,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      WHERE c.phone_number = ? AND c.deleted_at IS NULL
      GROUP BY c.customer_id
    `;
    
    const [customers] = await db.execute(query, [phone]);
    
    if (Array.isArray(customers) && customers.length === 0) {
      return res.status(404).json({ 
        error: 'No customer found with this phone number',
        phone_number: phone
      });
    }
    
    res.json({
      customer: customers[0],
      message: 'Customer found successfully'
    });
  } catch (error) {
    console.error('Error searching customer by phone:', error);
    res.status(500).json({ error: 'Failed to search customer' });
  }
});

// Search customers by order ID
router.get('/search/order/:order_id', async (req: AuditableRequest, res) => {
  try {
    const { order_id } = req.params;
    
    const query = `
      SELECT 
        c.customer_id,
        c.customer_name,
        c.phone_number,
        c.email,
        c.address,
        c.registration_date,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at,
        o.order_id,
        o.order_number,
        o.order_date,
        o.total_amount as order_amount,
        o.status as order_status,
        o.payment_status,
        COUNT(o2.order_id) as total_orders,
        COALESCE(SUM(o2.total_amount), 0) as total_spent
      FROM customers c
      INNER JOIN orders o ON c.customer_id = o.customer_id
      LEFT JOIN orders o2 ON c.customer_id = o2.customer_id
      WHERE (o.order_id = ? OR o.order_number LIKE ?) AND c.deleted_at IS NULL
      GROUP BY c.customer_id, o.order_id
    `;
    
    const [results] = await db.execute(query, [order_id, `%${order_id}%`]);
    
    if (Array.isArray(results) && results.length === 0) {
      return res.status(404).json({ 
        error: 'No customer found with this order ID',
        order_id: order_id
      });
    }
    
    res.json({
      results,
      message: `Found ${Array.isArray(results) ? results.length : 0} result(s) for order ID: ${order_id}`
    });
  } catch (error) {
    console.error('Error searching customer by order ID:', error);
    res.status(500).json({ error: 'Failed to search customer by order ID' });
  }
});

// GET search customers with audit information (updated to support both query params and path params)
router.get('/search/:query', async (req: AuditableRequest, res) => {
  try {
    const { query } = req.params;
    const searchQuery = `
      SELECT 
        c.customer_id,
        c.customer_name,
        c.phone_number,
        c.email,
        c.address,
        c.registration_date,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at,
        c.created_by,
        c.updated_by,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      WHERE (c.customer_name LIKE ? OR c.phone_number LIKE ?) 
        AND c.deleted_at IS NULL
      GROUP BY c.customer_id
      ORDER BY c.customer_name ASC
      LIMIT 20
    `;
    
    const searchTerm = `%${query}%`;
    const [customers] = await db.execute(searchQuery, [searchTerm, searchTerm]);
    res.json({
      customers,
      search_term: query,
      total_results: Array.isArray(customers) ? customers.length : 0
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

export default router;