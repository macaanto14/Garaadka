#!/bin/bash

# ========================================================================
# QUICK FIX FOR 502 BAD GATEWAY ERROR - GARAADKA BACKEND
# ========================================================================
# This script attempts to fix the 502 error by restarting the backend
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

print_status "🔧 Quick Fix for 502 Bad Gateway Error"
echo "========================================================================="

# 1. Stop all PM2 processes
print_status "1. Stopping all PM2 processes..."
sudo -u garaadka pm2 delete all 2>/dev/null || true
sudo -u garaadka pm2 kill 2>/dev/null || true

# 2. Check if tsx is installed globally
print_status "2. Checking tsx installation..."
if ! command -v tsx >/dev/null 2>&1; then
    print_warning "⚠️ tsx not found globally, installing..."
    sudo npm install -g tsx
fi

# 3. Navigate to backend directory and install dependencies
print_status "3. Installing/updating backend dependencies..."
cd /home/garaadka/backend
sudo -u garaadka npm install

# 4. Test backend manually first
print_status "4. Testing backend startup..."
print_status "Starting backend in background for 10 seconds to test..."

# Start backend in background
sudo -u garaadka nohup tsx index.ts > /tmp/backend-test.log 2>&1 &
BACKEND_PID=$!

# Wait a few seconds
sleep 5

# Test if it's responding
if curl -s http://localhost:5000/api/health >/dev/null; then
    print_success "✅ Backend responds correctly"
    # Kill the test process
    kill $BACKEND_PID 2>/dev/null || true
else
    print_error "❌ Backend still not responding"
    print_status "Backend test log:"
    cat /tmp/backend-test.log || true
    kill $BACKEND_PID 2>/dev/null || true
    
    # Try to identify the issue
    print_status "🔍 Checking for common issues..."
    
    # Check if .env file exists
    if [ ! -f ".env.production" ]; then
        print_warning "⚠️ .env.production missing, copying from /etc/garaadka/"
        sudo cp /etc/garaadka/.env.production . 2>/dev/null || true
        sudo chown garaadka:garaadka .env.production 2>/dev/null || true
    fi
    
    # Check database connection
    print_status "Testing database connection..."
    if ! mysql -h localhost -u gwldb-user -pmoha983936mm -e "SELECT 1;" 2>/dev/null; then
        print_error "❌ Database connection failed"
        print_status "Starting MariaDB service..."
        sudo systemctl start mariadb || sudo systemctl start mysql || true
    fi
    
    exit 1
fi

# 5. Start with PM2
print_status "5. Starting backend with PM2..."
cd /home/garaadka

# Make sure ecosystem.config.js exists
if [ ! -f "ecosystem.config.js" ]; then
    print_status "Creating ecosystem.config.js..."
    sudo -u garaadka tee ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'garaadka-backend',
      script: 'start-backend.js',
      cwd: '/home/garaadka/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      error_file: '/var/log/garaadka/backend-error.log',
      out_file: '/var/log/garaadka/backend-out.log',
      log_file: '/var/log/garaadka/backend-combined.log',
      time: true,
      autorestart: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs']
    }
  ]
};
EOF
fi

# Make sure start-backend.js exists
if [ ! -f "/home/garaadka/backend/start-backend.js" ]; then
    print_status "Creating start-backend.js wrapper..."
    sudo -u garaadka tee /home/garaadka/backend/start-backend.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Garaadka Backend for Netlify...');
console.log('📁 Working directory:', __dirname);
console.log('🌐 Environment:', process.env.NODE_ENV);
console.log('🗄️ Database: Local MariaDB');

const child = spawn('tsx', ['index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env }
});

child.on('error', (error) => {
  console.error('❌ Failed to start backend:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`🔄 Backend process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  child.kill('SIGINT');
});
EOF
fi

# Start PM2
sudo -u garaadka pm2 start ecosystem.config.js
sudo -u garaadka pm2 save

# 6. Wait and test
print_status "6. Waiting for backend to start..."
sleep 10

# Test PM2 status
if sudo -u garaadka pm2 list | grep -q "garaadka-backend.*online"; then
    print_success "✅ Backend is running in PM2"
else
    print_error "❌ Backend failed to start in PM2"
    print_status "PM2 logs:"
    sudo -u garaadka pm2 logs garaadka-backend --lines 20
    exit 1
fi

# Test API response
if curl -s http://localhost:5000/api/health >/dev/null; then
    print_success "✅ Backend API is responding"
else
    print_error "❌ Backend API is not responding"
    exit 1
fi

# 7. Restart Nginx
print_status "7. Restarting Nginx..."
sudo systemctl restart nginx

# 8. Final test
print_status "8. Final test..."
sleep 3

if curl -s https://api.einventory.et/health >/dev/null; then
    print_success "✅ HTTPS API is working"
elif curl -s http://64.227.158.26/health >/dev/null; then
    print_success "✅ HTTP API is working"
else
    print_warning "⚠️ External API test failed, but backend is running"
fi

echo ""
echo "========================================================================="
print_success "🎉 502 ERROR FIX COMPLETE!"
echo "========================================================================="
echo "✅ Backend is running on port 5000"
echo "✅ PM2 is managing the backend process"
echo "✅ Nginx has been restarted"
echo ""
echo "🧪 Test your API:"
echo "  curl https://api.einventory.et/health"
echo "  curl https://api.einventory.et/api/health"
echo ""
echo "📊 Monitor backend:"
echo "  sudo -u garaadka pm2 list"
echo "  sudo -u garaadka pm2 logs garaadka-backend"
echo "  sudo -u garaadka pm2 monit"
echo "========================================================================="