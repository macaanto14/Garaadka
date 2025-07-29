@echo off
echo Testing Cloud Deployment...
echo.

echo 1. Testing Health Endpoint...
curl -X GET "http://47.236.39.181:5000/api/health" -H "Content-Type: application/json"
echo.
echo.

echo 2. Testing Auth Endpoint (should return error)...
curl -X POST "http://47.236.39.181:5000/api/auth/login" -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"test\"}"
echo.
echo.

echo 3. Testing Customers Endpoint (might need auth)...
curl -X GET "http://47.236.39.181:5000/api/customers" -H "Content-Type: application/json"
echo.
echo.

echo Cloud testing completed!
pause