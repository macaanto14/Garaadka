# Garaadka Laundry Management System - API Testing Guide

## Overview
This guide provides comprehensive instructions for testing all API endpoints using the provided Postman collection with real database data.

## Prerequisites

### 1. Environment Setup
- Ensure your server is running on `http://localhost:3000`
- Database should be properly configured with the complete schema
- Import both files into Postman:
  - `Garaadka-Complete-API-Testing.postman_collection.json`
  - `Garaadka-Complete-Testing.postman_environment.json`

### 2. Database Preparation
Make sure your database has the default admin user:
```sql
-- Default admin credentials
Username: admin
Password: admin123
Personal ID: ADMIN001
```

## Testing Workflow

### Phase 1: Authentication Testing
**Order of execution:**
1. **Login Admin** - This will automatically set the `auth_token` in environment variables
2. **Get Profile** - Verify token is working
3. **Register New User** - Test user creation
4. **Change Password** - Test password update functionality
5. **Logout** - Test session termination

### Phase 2: Customer Management Testing
**Order of execution:**
1. **Create Customer** - Creates a customer and saves `customer_id`
2. **Create Second Customer** - Creates another customer for testing
3. **Get All Customers** - List all customers with pagination
4. **Get Customer by ID** - Retrieve specific customer
5. **Update Customer** - Modify customer information
6. **Search Customers** - Test search functionality
7. **Customer Statistics** - View customer analytics

### Phase 3: Order Management Testing
**Order of execution:**
1. **Create Order** - Creates an order and saves `order_id`
2. **Create Second Order** - Creates another order for testing
3. **Get All Orders** - List orders with filtering
4. **Get Order by ID** - Retrieve specific order details
5. **Update Order** - Modify order information
6. **Update Order Status** - Change order status
7. **Get Orders by Customer** - Filter orders by customer
8. **Order Statistics** - View order analytics

### Phase 4: Payment Processing Testing
**Order of execution:**
1. **Create Payment** - Process payment and saves `payment_id`
2. **Create Second Payment** - Process another payment
3. **Get All Payments** - List payments with filtering
4. **Get Payment by ID** - Retrieve specific payment
5. **Update Payment** - Modify payment information
6. **Get Payments by Order** - Filter payments by order
7. **Payment Statistics** - View payment analytics
8. **Process Refund** - Test refund functionality
9. **Generate Receipt** - Create payment receipt

### Phase 5: Receipt Management Testing
**Order of execution:**
1. **Generate Order Receipt** - Create receipt for an order

### Phase 6: Register System Testing (Legacy)
**Order of execution:**
1. **Create Register Entry** - Add new register record
2. **Get All Register Records** - List with pagination
3. **Get Register by ID** - Retrieve specific record
4. **Update Register Entry** - Modify record
5. **Update Payment Status** - Change payment status
6. **Search by Phone** - Test phone search
7. **Register Statistics** - View analytics

### Phase 7: Audit System Testing
**Order of execution:**
1. **Get Audit Logs** - View system audit trail
2. **Get Audit Statistics** - View audit analytics
3. **Get User Audit History** - Filter by user
4. **Get Record Audit History** - Filter by record
5. **Export Audit Logs** - Export functionality
6. **Create Manual Audit Log** - Manual log entry

### Phase 8: Error Handling Testing
**Test various error scenarios:**
1. **Test Invalid Customer ID** - 404 error handling
2. **Test Invalid Order ID** - 404 error handling
3. **Test Invalid Payment ID** - 404 error handling
4. **Test Unauthorized Access** - 401 error handling
5. **Test Invalid Token** - 403 error handling
6. **Test Duplicate Phone** - 409 error handling
7. **Test Invalid Customer for Order** - 400 error handling

## Expected Test Data

### Sample Customers
The collection will create customers with these details:
- **Customer 1**: Ahmed Hassan, +251911234567
- **Customer 2**: Fatima Ali, +251922345678

### Sample Orders
Orders will include various laundry items:
- Shirts, Pants, Dresses with different colors and sizes
- Various pricing and quantities
- Different due dates and delivery dates

### Sample Payments
Payments will test different scenarios:
- Full payments, partial payments
- Different payment methods (cash, card, transfer, mobile)
- Various amounts and statuses

## Environment Variables

The following variables are automatically set during testing:
- `auth_token` - JWT token for authentication
- `user_id` - Current user ID
- `customer_id` - Primary customer ID for testing
- `customer_id_2` - Secondary customer ID
- `order_id` - Primary order ID for testing
- `order_id_2` - Secondary order ID
- `payment_id` - Primary payment ID for testing
- `payment_id_2` - Secondary payment ID
- `register_id` - Register record ID
- `register_user_id` - Register user ID

## Running the Tests

### Option 1: Manual Testing
1. Import the collection and environment
2. Select the "Garaadka Complete Testing Environment"
3. Run requests in the recommended order
4. Check responses and verify data in database

### Option 2: Automated Testing (Collection Runner)
1. Open Postman Collection Runner
2. Select "Garaadka Laundry Management - Complete API Testing"
3. Select "Garaadka Complete Testing Environment"
4. Set iterations to 1
5. Add delay between requests (500ms recommended)
6. Run the entire collection

### Option 3: Newman (Command Line)
```bash
# Install Newman if not already installed
npm install -g newman

# Run the collection
newman run "Garaadka-Complete-API-Testing.postman_collection.json" \
  -e "Garaadka-Complete-Testing.postman_environment.json" \
  --delay-request 500 \
  --reporters cli,html \
  --reporter-html-export newman-report.html
```

## Verification Steps

### 1. Database Verification
After running tests, verify in your database:
```sql
-- Check created customers
SELECT * FROM customers WHERE deleted_at IS NULL;

-- Check created orders
SELECT * FROM orders WHERE deleted_at IS NULL;

-- Check created payments
SELECT * FROM payments WHERE deleted_at IS NULL;

-- Check audit logs
SELECT * FROM audit ORDER BY created_at DESC LIMIT 20;
```

### 2. Response Verification
Check that responses include:
- Proper HTTP status codes (200, 201, 404, etc.)
- Correct JSON structure
- Expected data fields
- Proper error messages for invalid requests

### 3. Business Logic Verification
Verify that:
- Order totals are calculated correctly
- Payment amounts update order paid_amount
- Payment status changes appropriately
- Audit logs are created for all operations
- Soft deletes work properly (deleted_at field)

## Common Issues and Solutions

### 1. Authentication Issues
**Problem**: 401 Unauthorized errors
**Solution**: 
- Ensure you run "Login Admin" first
- Check that `auth_token` is set in environment
- Verify admin user exists in database

### 2. Database Connection Issues
**Problem**: 500 Internal Server Error
**Solution**:
- Check database connection in server logs
- Verify database schema is properly created
- Ensure all required tables exist

### 3. Foreign Key Constraint Issues
**Problem**: Cannot create orders/payments
**Solution**:
- Ensure customers are created first
- Check that customer_id exists before creating orders
- Verify order_id exists before creating payments

### 4. Validation Errors
**Problem**: 400 Bad Request errors
**Solution**:
- Check request body format matches expected schema
- Verify required fields are provided
- Ensure data types are correct (numbers, dates, etc.)

## Performance Testing

### Load Testing with Newman
```bash
# Run collection multiple times to test performance
newman run "Garaadka-Complete-API-Testing.postman_collection.json" \
  -e "Garaadka-Complete-Testing.postman_environment.json" \
  --iteration-count 10 \
  --delay-request 100
```

### Monitoring During Tests
Monitor these metrics:
- Response times for each endpoint
- Database connection pool usage
- Memory usage
- CPU utilization
- Error rates

## Security Testing

The collection includes tests for:
- Authentication bypass attempts
- Invalid token usage
- Unauthorized access to protected endpoints
- SQL injection prevention (through parameterized queries)
- Input validation

## Reporting

### Test Results Documentation
Document the following for each test run:
- Date and time of testing
- Environment details (local/staging/production)
- Pass/fail status for each endpoint
- Performance metrics
- Any issues encountered
- Database state before and after testing

### Automated Reporting
Use Newman HTML reporter for detailed test reports:
```bash
newman run collection.json -e environment.json --reporters html --reporter-html-export report.html
```

## Maintenance

### Regular Testing Schedule
- Run full test suite before each deployment
- Run smoke tests daily in development
- Run performance tests weekly
- Update test data monthly

### Collection Updates
When adding new endpoints:
1. Add new requests to appropriate folders
2. Update environment variables if needed
3. Add proper test scripts for response validation
4. Update this documentation

## Support

For issues with the API testing:
1. Check server logs for detailed error messages
2. Verify database state and schema
3. Review Postman console for request/response details
4. Check environment variable values
5. Ensure proper test execution order

---

**Note**: This collection contains realistic test data that will create actual records in your database. Use a test database environment to avoid affecting production data.