#!/bin/bash

# ========================================================================
# TEST FULL STACK DEPLOYMENT
# ========================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🧪 Testing Full Stack Deployment"
echo "================================"

# Test 1: PM2 Status
echo ""
print_status "1. Checking PM2 processes..."
sudo -u garaadka pm2 list

# Test 2: Port Status
echo ""
print_status "2. Checking ports..."
netstat -tlnp | grep -E ":(80|3000|5000) " || print_warning "Some ports may not be listening"

# Test 3: Local API Tests
echo ""
print_status "3. Testing local API endpoints..."

test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s --connect-timeout 5 "$url" > /dev/null; then
        print_success "✅ $name: Working"
    else
        print_error "❌ $name: Failed"
    fi
}

test_endpoint "http://localhost:5000/api/health" "Backend API (direct)"
test_endpoint "http://localhost:3000" "Frontend (direct)"
test_endpoint "http://localhost/api/health" "Backend API (via Nginx)"
test_endpoint "http://localhost" "Frontend (via Nginx)"

# Test 4: Database Connection
echo ""
print_status "4. Testing database connection..."
DB_HOST="47.236.39.181"
DB_USER="gwldb-user"
DB_PASSWORD="moha983936mm"
DB_NAME="gwldb"
DB_PORT="3306"

if timeout 10 mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "SELECT 1;" 2>/dev/null; then
    print_success "✅ Database connection: Working"
else
    print_error "❌ Database connection: Failed"
fi

# Test 5: External Access
echo ""
print_status "5. Testing external access..."
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
print_status "Server IP: $SERVER_IP"

if curl -s --connect-timeout 10 "http://$SERVER_IP" > /dev/null; then
    print_success "✅ External access: Working"
else
    print_error "❌ External access: Failed (check firewall/security groups)"
fi

# Test 6: API Endpoints
echo ""
print_status "6. Testing API endpoints..."

test_api_endpoint() {
    local endpoint=$1
    local name=$2
    
    response=$(curl -s -w "%{http_code}" "http://localhost:5000/api/$endpoint" -o /tmp/api_test 2>/dev/null)
    if [[ "$response" == "200" ]] || [[ "$response" == "404" ]] || [[ "$response" == "401" ]]; then
        print_success "✅ $name: Responding (HTTP $response)"
    else
        print_error "❌ $name: Not responding"
    fi
}

test_api_endpoint "health" "Health Check"
test_api_endpoint "customers" "Customers API"
test_api_endpoint "orders" "Orders API"
test_api_endpoint "payments" "Payments API"

echo ""
print_status "📋 Summary:"
echo "  Frontend URL: http://$SERVER_IP"
echo "  Backend API: http://$SERVER_IP/api"
echo "  Health Check: http://$SERVER_IP/api/health"
echo ""
print_status "🔧 If issues found, check logs:"
echo "  sudo -u garaadka pm2 logs"
echo "  sudo tail -f /var/log/nginx/error.log"