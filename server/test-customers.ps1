# Customer API Test Script
$BaseUrl = "http://localhost:3000/api/customers"
$Token = "your-jwt-token-here"  # Replace with actual JWT token

$Headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

Write-Host "🚀 Starting Customer API Tests" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Test 1: Get latest 5 customers
Write-Host "`n1️⃣ Testing GET /customers (latest 5 customers)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $BaseUrl -Method GET -Headers $Headers
    Write-Host "✅ Success: Found $($response.customers.Count) customers" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get all customers
Write-Host "`n2️⃣ Testing GET /customers/all" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/all" -Method GET -Headers $Headers
    Write-Host "✅ Success: Found $($response.Count) total customers" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get paginated customers
Write-Host "`n3️⃣ Testing GET /customers/paginated" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/paginated?page=1&limit=5" -Method GET -Headers $Headers
    Write-Host "✅ Success: Page $($response.pagination.current_page) of $($response.pagination.total_pages)" -ForegroundColor Green
    Write-Host "Customers on this page: $($response.customers.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Create new customer
Write-Host "`n4️⃣ Testing POST /customers (create customer)" -ForegroundColor Yellow
$newCustomer = @{
    customer_name = "Test Customer Ahmed Mohamed"
    phone_number = "0987654321"
    email = "test@example.com"
    address = "Test Address, Jigjiga"
    notes = "Test customer for API testing"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $BaseUrl -Method POST -Headers $Headers -Body $newCustomer
    Write-Host "✅ Success: Created customer with ID $($response.customer_id)" -ForegroundColor Green
    $createdCustomerId = $response.customer_id
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    $createdCustomerId = $null
}

# Test 5: Get customer by ID
if ($createdCustomerId) {
    Write-Host "`n5️⃣ Testing GET /customers/$createdCustomerId" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/$createdCustomerId" -Method GET -Headers $Headers
        Write-Host "✅ Success: Found customer '$($response.customer_name)'" -ForegroundColor Green
        Write-Host "Phone: $($response.phone_number), Orders: $($response.total_orders)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Search by phone number
Write-Host "`n6️⃣ Testing GET /customers/search/phone/927802065" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/search/phone/927802065" -Method GET -Headers $Headers
    Write-Host "✅ Success: Found customer '$($response.customer.customer_name)'" -ForegroundColor Green
    Write-Host "Phone searched: $($response.phone_searched), Phone found: $($response.phone_found)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Multi-criteria search
Write-Host "`n7️⃣ Testing GET /customers/search (multi-criteria)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/search?query=ISMAIL&search_type=any" -Method GET -Headers $Headers
    Write-Host "✅ Success: Found $($response.total_results) customers" -ForegroundColor Green
    Write-Host "Search criteria: $($response.search_criteria | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Search by query parameter
Write-Host "`n8️⃣ Testing GET /customers/search/ISMAIL" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/search/ISMAIL" -Method GET -Headers $Headers
    Write-Host "✅ Success: Found $($response.total_results) customers for '$($response.search_term)'" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Update customer (if we created one)
if ($createdCustomerId) {
    Write-Host "`n9️⃣ Testing PUT /customers/$createdCustomerId" -ForegroundColor Yellow
    $updateCustomer = @{
        customer_name = "Updated Test Customer"
        phone_number = "0987654322"
        email = "updated@example.com"
        address = "Updated Address"
        notes = "Updated test customer"
        status = "active"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/$createdCustomerId" -Method PUT -Headers $Headers -Body $updateCustomer
        Write-Host "✅ Success: $($response.message)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 10: Validation tests
Write-Host "`n🔟 Testing validation errors" -ForegroundColor Yellow

# Test missing required fields
Write-Host "`n   📝 Testing missing phone number..." -ForegroundColor Gray
$invalidCustomer1 = @{
    customer_name = "Test User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $BaseUrl -Method POST -Headers $Headers -Body $invalidCustomer1
    Write-Host "   ❌ Unexpected success" -ForegroundColor Red
} catch {
    Write-Host "   ✅ Correctly rejected: Missing phone number" -ForegroundColor Green
}

# Test invalid name format
Write-Host "`n   📝 Testing single name..." -ForegroundColor Gray
$invalidCustomer2 = @{
    customer_name = "Test"
    phone_number = "0912345678"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $BaseUrl -Method POST -Headers $Headers -Body $invalidCustomer2
    Write-Host "   ❌ Unexpected success" -ForegroundColor Red
} catch {
    Write-Host "   ✅ Correctly rejected: Single name not allowed" -ForegroundColor Green
}

# Test 11: Clean up - delete test customer
if ($createdCustomerId) {
    Write-Host "`n🗑️ Testing DELETE /customers/$createdCustomerId (cleanup)" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/$createdCustomerId" -Method DELETE -Headers $Headers
        Write-Host "✅ Success: $($response.message)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 All tests completed!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green