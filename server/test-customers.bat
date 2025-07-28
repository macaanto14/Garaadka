@echo off
echo Starting Customer API Tests
echo ===========================

set BASE_URL=http://localhost:5000/api/customers
set TOKEN=your-jwt-token-here

echo.
echo 1. Testing GET /customers (latest 5 customers)
curl -X GET "%BASE_URL%" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"

echo.
echo.
echo 2. Testing GET /customers/all
curl -X GET "%BASE_URL%/all" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"

echo.
echo.
echo 3. Testing GET /customers/paginated
curl -X GET "%BASE_URL%/paginated?page=1&limit=5" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"

echo.
echo.
echo 4. Testing POST /customers (create customer)
curl -X POST "%BASE_URL%" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"customer_name\":\"Test Customer Ahmed\",\"phone_number\":\"0987654321\",\"email\":\"test@example.com\",\"address\":\"Test Address\",\"notes\":\"Test customer\"}"

echo.
echo.
echo 5. Testing GET /customers/1 (get customer by ID)
curl -X GET "%BASE_URL%/1" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"

echo.
echo.
echo 6. Testing GET /customers/search/phone/927802065
curl -X GET "%BASE_URL%/search/phone/927802065" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"

echo.
echo.
echo 7. Testing GET /customers/search?query=ISMAIL
curl -X GET "%BASE_URL%/search?query=ISMAIL" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"

echo.
echo.
echo 8. Testing GET /customers/search/ISMAIL
curl -X GET "%BASE_URL%/search/ISMAIL" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"

echo.
echo.
echo Tests completed!
pause