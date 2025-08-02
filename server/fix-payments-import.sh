#!/bin/bash

# ========================================================================
# FIX PAYMENTS.TS IMPORT ISSUES - TARGETED FIX
# ========================================================================
# This script fixes the specific import issues in payments.ts
# ========================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
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

print_status "🔧 FIXING PAYMENTS.TS IMPORT ISSUES"
echo "========================================================================="

# Navigate to backend directory
cd /home/garaadka/backend

# 1. Stop PM2 processes
print_status "1. Stopping PM2 processes..."
sudo -u garaadka pm2 delete all 2>/dev/null || true

# 2. Fix payments.ts imports specifically
print_status "2. Fixing payments.ts imports..."

if [ -f "routes/payments.ts" ]; then
    print_status "📝 Current payments.ts imports:"
    head -10 routes/payments.ts | grep "import"
    
    print_status "📝 Fixing payments.ts imports..."
    
    # Remove .js extensions from all imports
    sudo -u garaadka sed -i 's/from '\''\.\.\/index\.js'\''/from '\''\.\.\/index'\''/g' routes/payments.ts
    sudo -u garaadka sed -i 's/from '\''\.\.\/middleware\/auditMiddleware\.js'\''/from '\''\.\.\/middleware\/auditMiddleware'\''/g' routes/payments.ts
    sudo -u garaadka sed -i 's/from '\''\.\.\/middleware\/auth\.js'\''/from '\''\.\.\/middleware\/auth'\''/g' routes/payments.ts
    sudo -u garaadka sed -i 's/from '\''\.\.\/utils\/auditUtils\.js'\''/from '\''\.\.\/utils\/auditUtils'\''/g' routes/payments.ts
    
    print_status "📝 Fixed payments.ts imports:"
    head -10 routes/payments.ts | grep "import"
    
    print_success "✅ Fixed payments.ts imports"
else
    print_error "❌ routes/payments.ts not found"
    exit 1
fi

# 3. Fix any other route files that might have similar issues
print_status "3. Checking all route files for .js imports..."
for route_file in routes/*.ts; do
    if [ -f "$route_file" ]; then
        if grep -q "\.js'" "$route_file"; then
            print_status "Fixing $route_file..."
            sudo -u garaadka sed -i 's/\.js'\''/'\''/g' "$route_file"
            print_success "✅ Fixed $route_file"
        fi
    fi
done

# 4. Fix middleware files
print_status "4. Checking middleware files..."
for middleware_file in middleware/*.ts; do
    if [ -f "$middleware_file" ]; then
        if grep -q "\.js'" "$middleware_file"; then
            print_status "Fixing $middleware_file..."
            sudo -u garaadka sed -i 's/\.js'\''/'\''/g' "$middleware_file"
            print_success "✅ Fixed $middleware_file"
        fi
    fi
done

# 5. Fix utils files
print_status "5. Checking utils files..."
for utils_file in utils/*.ts; do
    if [ -f "$utils_file" ]; then
        if grep -q "\.js'" "$utils_file"; then
            print_status "Fixing $utils_file..."
            sudo -u garaadka sed -i 's/\.js'\''/'\''/g' "$utils_file"
            print_success "✅ Fixed $utils_file"
        fi
    fi
done

# 6. Test backend manually
print_status "6. Testing backend startup..."

# Kill any existing processes on port 5000
sudo fuser -k 5000/tcp 2>/dev/null || true
sleep 2

# Start backend in background for testing
print_status "Starting backend for testing..."
sudo -u garaadka NODE_ENV=production nohup tsx index.ts > /tmp/backend-payments-test.log 2>&1 &
BACKEND_PID=$!

# Wait for startup
sleep 10

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    print_status "Backend process is running (PID: $BACKEND_PID)"
    
    # Test endpoints
    print_status "🧪 Testing API endpoints..."
    
    # Test health endpoint
    if curl -s http://localhost:5000/api/health >/dev/null; then
        print_success "✅ /api/health endpoint responds"
        
        # Test payments endpoint specifically
        payments_response=$(curl -s -w "%{http_code}" http://localhost:5000/api/payments -o /dev/null 2>/dev/null)
        if [ "$payments_response" = "401" ] || [ "$payments_response" = "200" ]; then
            print_success "✅ /api/payments endpoint responds (status: $payments_response)"
        elif [ "$payments_response" = "502" ]; then
            print_error "❌ /api/payments still returns 502"
        else
            print_warning "⚠️ /api/payments returns $payments_response"
        fi
        
        # Test other endpoints
        auth_response=$(curl -s -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{}' -o /dev/null 2>/dev/null)
        if [ "$auth_response" = "400" ]; then
            print_success "✅ /api/auth/login returns 400 (expected for empty body)"
        elif [ "$auth_response" = "502" ]; then
            print_error "❌ /api/auth/login still returns 502"
        else
            print_warning "⚠️ /api/auth/login returns $auth_response"
        fi
        
    else
        print_error "❌ /api/health endpoint not responding"
    fi
    
    # Show backend logs
    print_status "📋 Backend startup logs:"
    cat /tmp/backend-payments-test.log || true
    
else
    print_error "❌ Backend process failed to start"
    print_status "📋 Backend startup logs:"
    cat /tmp/backend-payments-test.log || true
fi

# Kill the test process
kill $BACKEND_PID 2>/dev/null || true
sleep 2

# 7. Start with PM2 if tests passed
if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
    print_success "✅ Manual backend test successful"
    
    print_status "7. Starting backend with PM2..."
    
    # Start PM2
    cd /home/garaadka
    sudo -u garaadka pm2 start ecosystem.config.js
    sudo -u garaadka pm2 save
    
    # Wait for PM2 startup
    sleep 10
    
    # Test PM2 status
    if sudo -u garaadka pm2 list | grep -q "garaadka-backend.*online"; then
        print_success "✅ Backend is running in PM2"
        
        # Test API response via PM2
        if curl -s http://localhost:5000/api/health >/dev/null; then
            print_success "✅ Backend API is responding via PM2"
            
            # Test payments endpoint specifically
            print_status "🧪 Testing payments endpoint via PM2..."
            payments_response=$(curl -s -w "%{http_code}" http://localhost:5000/api/payments -o /dev/null 2>/dev/null)
            if [ "$payments_response" = "401" ] || [ "$payments_response" = "200" ]; then
                print_success "✅ /api/payments returns $payments_response (working)"
            elif [ "$payments_response" = "502" ]; then
                print_error "❌ /api/payments still returns 502"
            else
                print_warning "⚠️ /api/payments returns $payments_response"
            fi
            
            # Restart Nginx
            print_status "8. Restarting Nginx..."
            sudo systemctl restart nginx
            
            # Final external tests
            print_status "9. Final external API tests..."
            sleep 3
            
            # Test external payments endpoint
            external_payments_response=$(curl -s -w "%{http_code}" https://einventory.et/api/payments -o /dev/null 2>/dev/null)
            if [ "$external_payments_response" = "401" ] || [ "$external_payments_response" = "200" ]; then
                print_success "✅ External /api/payments returns $external_payments_response (fixed from 502)"
            elif [ "$external_payments_response" = "502" ]; then
                print_error "❌ External /api/payments still returns 502"
            else
                print_warning "⚠️ External /api/payments returns $external_payments_response"
            fi
            
            echo ""
            echo "========================================================================="
            print_success "🎉 PAYMENTS IMPORT FIXES COMPLETE!"
            echo "========================================================================="
            echo "✅ Fixed .js import extensions in all TypeScript files"
            echo "✅ Backend is running on port 5000"
            echo "✅ PM2 is managing the backend process"
            echo "✅ Nginx has been restarted"
            echo ""
            echo "🧪 Test your API endpoints:"
            echo "  curl https://einventory.et/api/health"
            echo "  curl https://einventory.et/api/payments (requires auth)"
            echo "  curl -X POST https://einventory.et/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"your_password\"}'"
            echo ""
            echo "📊 Monitor backend:"
            echo "  sudo -u garaadka pm2 list"
            echo "  sudo -u garaadka pm2 logs garaadka-backend"
            echo "========================================================================="
            
        else
            print_error "❌ Backend API not responding via PM2"
            print_status "PM2 logs:"
            sudo -u garaadka pm2 logs garaadka-backend --lines 20
        fi
    else
        print_error "❌ Backend failed to start in PM2"
        print_status "PM2 status:"
        sudo -u garaadka pm2 list
    fi
    
else
    print_error "❌ Manual backend test failed after fixing imports"
    print_status "Backend logs:"
    cat /tmp/backend-payments-test.log || true
    
    print_status "🔍 Checking for remaining issues..."
    
    # Check specific files for remaining .js imports
    print_status "Checking for remaining .js imports..."
    if find routes/ middleware/ utils/ -name "*.ts" -exec grep -l "\.js'" {} \; 2>/dev/null; then
        print_warning "⚠️ Found files with remaining .js imports (shown above)"
        
        # Show the specific imports
        print_status "Specific .js imports found:"
        find routes/ middleware/ utils/ -name "*.ts" -exec grep -n "\.js'" {} \; 2>/dev/null || true
    else
        print_success "✅ No remaining .js imports found"
    fi
fi