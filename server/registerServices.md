Register API Endpoints
1. Search by Phone Number
http

GET /api/register/search/:phone
Purpose: Search register records by phone number
Parameters: phone (URL parameter, minimum 3 characters)
Response: Array of matching records with customer details
Example: GET /api/register/search/252612345678
2. Get All Records (Paginated)
http

GET /api/register
Purpose: Fetch all register records with pagination and filtering
Query Parameters:
page (optional, default: 1)
limit (optional, default: 10)
status (optional, filter by delivery status: pending, ready, delivered, cancelled)
Response: Paginated records with metadata
Example: GET /api/register?page=1&limit=20&status=pending
3. Get Record by ID
http
GET /api/register/:id
Purpose: Fetch a specific register record by ID
Parameters: id (URL parameter)
Response: Single record object
Example: GET /api/register/123
4. Update Delivery Status
http
PUT /api/register/:id/status
Purpose: Update delivery status of a register record
Parameters: id (URL parameter)
Body:
JSON

{  "delivery_status": "pending|  ready|delivered|cancelled",  "notes": "Optional notes"}
Response: Updated record with confirmation message
5. Create New Register Entry
http

POST /api/register
Purpose: Create a new register entry
Body:
JSON
{  "name": "Customer Name",  "customer_name": "Optional   customer name",  "phone": "+252 61 234 5678",  "email": "optional@email.com",  "laundry_items": ["item1",   "item2"],  "drop_off_date": "2024-01-01",  "total_amount": 100.00,  "paid_amount": 50.00,  "payment_status": "pending|  paid|partial",  "notes": "Optional notes"}
Response: Created record with generated receipt number
6. Update Register Entry
http
PUT /api/register/:id
Purpose: Update an existing register entry
Parameters: id (URL parameter)
Body: Same as POST but all fields are optional
Response: Updated record
7. Delete Register Entry (Soft Delete)
http
DELETE /api/register/:id
Purpose: Soft delete a register entry
Parameters: id (URL parameter)
Response: Confirmation message with deleted record info
8. Get Statistics
http
GET /api/register/stats/summary
Purpose: Get register statistics and summary
Response:
JSON
{  "total_records": 150,  "pending_deliveries": 25,  "ready_for_pickup": 10,  "delivered": 100,  "cancelled": 15,  "total_revenue": 15000.00,  "total_paid": 12000.00,  "total_outstanding": 3000.00}
Common Response Fields
All register records include these fields:

id, name, customer_name, phone, email
laundry_items, drop_off_date, pickup_date
delivery_status, total_amount, paid_amount, balance
payment_status, notes, receipt_number, status
created_at, updated_at, created_by, updated_by
Authentication & Audit
All endpoints use audit middleware that tracks:

User who created/updated records
Timestamps for all operations
Soft delete functionality (records are never permanently deleted)
The API base URL is configured in your environment as http://localhost:5000/api for development.


# Get all records
curl http://localhost:5000/api/register

# Search by phone
curl http://localhost:5000/api/register/search/252612345678

# Get statistics
curl http://localhost:5000/api/register/stats/summary