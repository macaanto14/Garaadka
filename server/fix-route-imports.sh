#!/bin/bash

# ========================================================================
# FIX ROUTE IMPORT ISSUES - TARGETED 502 ERROR FIX
# ========================================================================
# This script fixes the .js import extensions in route files
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

print_status "🔧 FIXING ROUTE IMPORT ISSUES"
echo "========================================================================="

# Navigate to backend directory
cd /home/garaadka/backend

# 1. Stop PM2 processes
print_status "1. Stopping PM2 processes..."
sudo -u garaadka pm2 delete all 2>/dev/null || true

# 2. Fix route files with .js import extensions
print_status "2. Fixing route import issues..."

# Fix orders.ts
if [ -f "routes/orders.ts" ]; then
    print_status "📝 Fixing routes/orders.ts imports..."
    sudo -u garaadka sed -i 's/from '\''\.\.\/index\.js'\''/from '\''\.\.\/index'\''/g' routes/orders.ts
    sudo -u garaadka sed -i 's/from '\''\.\.\/middleware\/auditMiddleware\.js'\''/from '\''\.\.\/middleware\/auditMiddleware'\''/g' routes/orders.ts
    print_success "✅ Fixed routes/orders.ts"
else
    print_warning "⚠️ routes/orders.ts not found"
fi

# Fix any other route files with .js extensions
print_status "📝 Checking and fixing all route files..."
for route_file in routes/*.ts; do
    if [ -f "$route_file" ]; then
        # Check if file has .js imports
        if grep -q "from.*\.js'" "$route_file"; then
            print_status "Fixing imports in $route_file..."
            sudo -u garaadka sed -i 's/from '\''\.\.\/.*\.js'\''/from '\''\.\.\/index'\''/g' "$route_file"
            sudo -u garaadka sed -i 's/from '\''\.\/.*\.js'\''/from '\''\.\/index'\''/g' "$route_file"
            sudo -u garaadka sed -i 's/from '\''\.\.\/middleware\/.*\.js'\''/from '\''\.\.\/middleware\/auditMiddleware'\''/g' "$route_file"
            sudo -u garaadka sed -i 's/from '\''\.\.\/utils\/.*\.js'\''/from '\''\.\.\/utils\/password'\''/g' "$route_file"
            print_success "✅ Fixed $route_file"
        fi
    fi
done

# 3. Fix middleware files
print_status "📝 Checking middleware files..."
for middleware_file in middleware/*.ts; do
    if [ -f "$middleware_file" ]; then
        if grep -q "from.*\.js'" "$middleware_file"; then
            print_status "Fixing imports in $middleware_file..."
            sudo -u garaadka sed -i 's/from '\''\.\.\/.*\.js'\''/from '\''\.\.\/index'\''/g' "$middleware_file"
            sudo -u garaadka sed -i 's/from '\''\.\/.*\.js'\''/from '\''\.\/password'\''/g' "$middleware_file"
            print_success "✅ Fixed $middleware_file"
        fi
    fi
done

# 4. Fix utils files
print_status "📝 Checking utils files..."
for utils_file in utils/*.ts; do
    if [ -f "$utils_file" ]; then
        if grep -q "from.*\.js'" "$utils_file"; then
            print_status "Fixing imports in $utils_file..."
            sudo -u garaadka sed -i 's/from '\''\.\.\/.*\.js'\''/from '\''\.\.\/index'\''/g' "$utils_file"
            print_success "✅ Fixed $utils_file"
        fi
    fi
done

# 5. Test backend manually
print_status "3. Testing backend startup..."

# Kill any existing processes on port 5000
sudo fuser -k 5000/tcp 2>/dev/null || true
sleep 2

# Start backend in background for testing
sudo -u garaadka NODE_ENV=production nohup tsx index.ts > /tmp/backend-route-test.log 2>&1 &
BACKEND_PID=$!

# Wait for startup
sleep 8

# Test endpoints
print_status "🧪 Testing API endpoints..."

# Test health endpoint
if curl -s http://localhost:5000/health >/dev/null; then
    print_success "✅ /health endpoint responds"
else
    print_error "❌ /health endpoint not responding"
fi

if curl -s http://localhost:5000/api/health >/dev/null; then
    print_success "✅ /api/health endpoint responds"
else
    print_error "❌ /api/health endpoint not responding"
fi

# Test auth endpoint
if curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1; then
    print_success "✅ /api/auth/login endpoint responds (even with empty data)"
else
    print_error "❌ /api/auth/login endpoint not responding"
fi

# Test customers endpoint
if curl -s http://localhost:5000/api/customers >/dev/null 2>&1; then
    print_success "✅ /api/customers endpoint responds"
else
    print_error "❌ /api/customers endpoint not responding"
fi

# Test orders endpoint
if curl -s http://localhost:5000/api/orders >/dev/null 2>&1; then
    print_success "✅ /api/orders endpoint responds"
else
    print_error "❌ /api/orders endpoint not responding"
fi

# Show backend logs
print_status "📋 Backend startup logs:"
cat /tmp/backend-route-test.log || true

# Kill the test process
kill $BACKEND_PID 2>/dev/null || true
sleep 2

# 6. Start with PM2 if tests passed
if curl -s http://localhost:5000/health >/dev/null 2>&1; then
    print_success "✅ Manual backend test successful"
    
    print_status "4. Starting backend with PM2..."
    
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
            
            # Test specific endpoints that were failing
            print_status "🧪 Testing previously failing endpoints..."
            
            # Test auth login (should return 400 for empty body, not 502)
            auth_response=$(curl -s -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{}' -o /dev/null)
            if [ "$auth_response" = "400" ]; then
                print_success "✅ /api/auth/login returns 400 (expected for empty body)"
            elif [ "$auth_response" = "502" ]; then
                print_error "❌ /api/auth/login still returns 502"
            else
                print_warning "⚠️ /api/auth/login returns $auth_response"
            fi
            
            # Test customers endpoint
            customers_response=$(curl -s -w "%{http_code}" http://localhost:5000/api/customers -o /dev/null)
            if [ "$customers_response" = "200" ] || [ "$customers_response" = "401" ]; then
                print_success "✅ /api/customers returns $customers_response (working)"
            elif [ "$customers_response" = "502" ]; then
                print_error "❌ /api/customers still returns 502"
            else
                print_warning "⚠️ /api/customers returns $customers_response"
            fi
            
            # Test orders endpoint
            orders_response=$(curl -s -w "%{http_code}" http://localhost:5000/api/orders -o /dev/null)
            if [ "$orders_response" = "200" ] || [ "$orders_response" = "401" ]; then
                print_success "✅ /api/orders returns $orders_response (working)"
            elif [ "$orders_response" = "502" ]; then
                print_error "❌ /api/orders still returns 502"
            else
                print_warning "⚠️ /api/orders returns $orders_response"
            fi
            
            # Restart Nginx
            print_status "5. Restarting Nginx..."
            sudo systemctl restart nginx
            
            # Final external tests
            print_status "6. Final external API tests..."
            sleep 3
            
            # Test external endpoints
            if curl -s https://einventory.et/api/health >/dev/null; then
                print_success "✅ External /api/health is working"
            else
                print_warning "⚠️ External /api/health test failed"
            fi
            
            # Test external auth endpoint
            external_auth_response=$(curl -s -w "%{http_code}" -X POST https://einventory.et/api/auth/login -H "Content-Type: application/json" -d '{}' -o /dev/null 2>/dev/null)
            if [ "$external_auth_response" = "400" ]; then
                print_success "✅ External /api/auth/login returns 400 (fixed from 502)"
            elif [ "$external_auth_response" = "502" ]; then
                print_error "❌ External /api/auth/login still returns 502"
            else
                print_warning "⚠️ External /api/auth/login returns $external_auth_response"
            fi
            
            echo ""
            echo "========================================================================="
            print_success "🎉 ROUTE IMPORT FIXES COMPLETE!"
            echo "========================================================================="
            echo "✅ Fixed .js import extensions in route files"
            echo "✅ Backend is running on port 5000"
            echo "✅ PM2 is managing the backend process"
            echo "✅ Nginx has been restarted"
            echo ""
            echo "🧪 Test your API endpoints:"
            echo "  curl https://einventory.et/api/health"
            echo "  curl -X POST https://einventory.et/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"test\",\"password\":\"test\"}'"
            echo "  curl https://einventory.et/api/customers (requires auth)"
            echo "  curl https://einventory.et/api/orders (requires auth)"
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
    cat /tmp/backend-route-test.log || true
    
    print_status "🔍 Checking for remaining issues..."
    
    # Check specific files for remaining .js imports
    print_status "Checking for remaining .js imports..."
    if grep -r "from.*\.js'" routes/ middleware/ utils/ 2>/dev/null; then
        print_warning "⚠️ Found remaining .js imports (shown above)"
    else
        print_success "✅ No remaining .js imports found"
    fi
fi