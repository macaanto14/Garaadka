#!/bin/bash

# ========================================================================
# GARAADKA DEPLOYMENT TROUBLESHOOTING SCRIPT
# ========================================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_header "🔍 GARAADKA DEPLOYMENT TROUBLESHOOTING"

# Check if we're running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root or with sudo"
   exit 1
fi

# 1. Check system services
print_header "📋 CHECKING SYSTEM SERVICES"

print_status "Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    print_success "✅ Nginx is running"
    nginx -t && print_success "✅ Nginx configuration is valid" || print_error "❌ Nginx configuration has errors"
else
    print_error "❌ Nginx is not running"
    print_status "Attempting to start Nginx..."
    systemctl start nginx
    if systemctl is-active --quiet nginx; then
        print_success "✅ Nginx started successfully"
    else
        print_error "❌ Failed to start Nginx"
        print_status "Nginx error logs:"
        journalctl -u nginx --no-pager -n 10
    fi
fi

# 2. Check PM2 processes
print_header "🔄 CHECKING PM2 PROCESSES"

if command -v pm2 &> /dev/null; then
    print_status "PM2 process list:"
    sudo -u garaadka pm2 list
    
    # Check if garaadka processes are running
    BACKEND_STATUS=$(sudo -u garaadka pm2 jlist | jq -r '.[] | select(.name=="garaadka-backend") | .pm2_env.status' 2>/dev/null || echo "not_found")
    FRONTEND_STATUS=$(sudo -u garaadka pm2 jlist | jq -r '.[] | select(.name=="garaadka-frontend") | .pm2_env.status' 2>/dev/null || echo "not_found")
    
    if [[ "$BACKEND_STATUS" == "online" ]]; then
        print_success "✅ Backend is running"
    else
        print_error "❌ Backend is not running (Status: $BACKEND_STATUS)"
        print_status "Attempting to start backend..."
        cd /home/garaadka
        sudo -u garaadka pm2 start ecosystem.config.js --only garaadka-backend
    fi
    
    if [[ "$FRONTEND_STATUS" == "online" ]]; then
        print_success "✅ Frontend is running"
    else
        print_error "❌ Frontend is not running (Status: $FRONTEND_STATUS)"
        print_status "Attempting to start frontend..."
        cd /home/garaadka
        sudo -u garaadka pm2 start ecosystem.config.js --only garaadka-frontend
    fi
else
    print_error "❌ PM2 is not installed"
fi

# 3. Check ports
print_header "🔌 CHECKING PORT STATUS"

check_port() {
    local port=$1
    local service=$2
    
    if netstat -tlnp | grep -q ":$port "; then
        print_success "✅ Port $port ($service): Open"
        local pid=$(netstat -tlnp | grep ":$port " | awk '{print $7}' | cut -d'/' -f1)
        print_status "   Process: $(ps -p $pid -o comm= 2>/dev/null || echo 'Unknown')"
    else
        print_error "❌ Port $port ($service): Not listening"
    fi
}

check_port 80 "HTTP/Nginx"
check_port 3000 "Frontend"
check_port 5000 "Backend API"

# 4. Check firewall
print_header "🔥 CHECKING FIREWALL STATUS"

if command -v ufw &> /dev/null; then
    print_status "UFW Status:"
    ufw status verbose
    
    print_status "Ensuring required ports are open..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw allow 5000/tcp
    ufw --force enable
else
    print_warning "⚠️ UFW not found, checking iptables..."
    iptables -L -n
fi

# 5. Test local connections
print_header "🌐 TESTING LOCAL CONNECTIONS"

test_url() {
    local url=$1
    local description=$2
    
    print_status "Testing $description: $url"
    if curl -s --connect-timeout 5 "$url" > /dev/null; then
        print_success "✅ $description: Accessible"
    else
        print_error "❌ $description: Not accessible"
        # Try with verbose output for debugging
        print_status "Detailed test:"
        curl -v --connect-timeout 5 "$url" 2>&1 | head -10
    fi
}

test_url "http://localhost" "Nginx (localhost)"
test_url "http://localhost:3000" "Frontend (direct)"
test_url "http://localhost:5000/api/health" "Backend API (direct)"

# 6. Check application logs
print_header "📝 CHECKING APPLICATION LOGS"

print_status "Recent Nginx error logs:"
tail -20 /var/log/nginx/error.log 2>/dev/null || print_warning "No Nginx error logs found"

print_status "Recent backend logs:"
if [ -f "/var/log/garaadka/backend-error.log" ]; then
    tail -20 /var/log/garaadka/backend-error.log
else
    print_warning "No backend error logs found"
    sudo -u garaadka pm2 logs garaadka-backend --lines 10 2>/dev/null || print_warning "No PM2 logs available"
fi

print_status "Recent frontend logs:"
if [ -f "/var/log/garaadka/frontend-error.log" ]; then
    tail -20 /var/log/garaadka/frontend-error.log
else
    print_warning "No frontend error logs found"
    sudo -u garaadka pm2 logs garaadka-frontend --lines 10 2>/dev/null || print_warning "No PM2 logs available"
fi

# 7. Check database connection
print_header "🗄️ TESTING DATABASE CONNECTION"

DB_HOST="47.236.39.181"
DB_USER="gwldb-user"
DB_PASSWORD="moha983936mm"
DB_NAME="gwldb"
DB_PORT="3306"

print_status "Testing database connection to $DB_HOST..."
if timeout 10 mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "SELECT 1;" 2>/dev/null; then
    print_success "✅ Database connection successful"
else
    print_error "❌ Database connection failed"
    print_status "Testing basic connectivity..."
    if timeout 5 telnet $DB_HOST $DB_PORT 2>/dev/null | grep -q "Connected"; then
        print_warning "⚠️ Port is open but MySQL connection failed (check credentials)"
    else
        print_error "❌ Cannot connect to $DB_HOST:$DB_PORT (network/firewall issue)"
    fi
fi

# 8. Quick fixes
print_header "🔧 APPLYING QUICK FIXES"

print_status "Restarting services..."

# Restart Nginx
systemctl restart nginx
if systemctl is-active --quiet nginx; then
    print_success "✅ Nginx restarted successfully"
else
    print_error "❌ Failed to restart Nginx"
fi

# Restart PM2 processes
if command -v pm2 &> /dev/null; then
    cd /home/garaadka
    sudo -u garaadka pm2 restart all
    print_success "✅ PM2 processes restarted"
fi

# 9. Final status check
print_header "📊 FINAL STATUS CHECK"

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
print_status "Server IP: $SERVER_IP"

print_status "Testing external access..."
if curl -s --connect-timeout 10 "http://$SERVER_IP" > /dev/null; then
    print_success "✅ Server is accessible from external IP"
else
    print_error "❌ Server is not accessible from external IP"
    print_warning "This could be due to:"
    echo "   - Cloud provider firewall/security groups"
    echo "   - Server firewall blocking external access"
    echo "   - Nginx not binding to external interface"
    echo "   - Services not running properly"
fi

print_header "🎯 RECOMMENDED ACTIONS"

echo "1. Check cloud provider security groups/firewall:"
echo "   - Ensure ports 80, 443 are open for inbound traffic"
echo "   - Check if your cloud provider has additional firewalls"
echo ""

echo "2. Verify Nginx is binding to all interfaces:"
echo "   sudo nginx -T | grep listen"
echo ""

echo "3. Check PM2 process status:"
echo "   sudo -u garaadka pm2 list"
echo "   sudo -u garaadka pm2 logs"
echo ""

echo "4. Test local connectivity:"
echo "   curl http://localhost"
echo "   curl http://localhost:3000"
echo "   curl http://localhost:5000/api/health"
echo ""

echo "5. If still not working, run this script again:"
echo "   sudo ./troubleshoot-deployment.sh"

print_success "🔍 Troubleshooting completed!"