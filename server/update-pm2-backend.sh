#!/bin/bash

# ========================================================================
# UPDATE PM2 CONFIGURATION FOR BACKEND API
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

print_status "🔧 Updating PM2 configuration for backend API..."

# Install tsx globally if not already installed
if ! command -v tsx &> /dev/null; then
    print_status "📦 Installing tsx globally..."
    sudo npm install -g tsx
fi

# Create updated PM2 ecosystem file
print_status "⚙️  Creating updated PM2 ecosystem configuration..."
sudo -u garaadka tee /home/garaadka/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'garaadka-backend-api',
      script: 'tsx',
      args: 'index.ts',
      cwd: '/home/garaadka/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_file: '/etc/garaadka/.env.production',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/garaadka/backend-api-error.log',
      out_file: '/var/log/garaadka/backend-api-out.log',
      log_file: '/var/log/garaadka/backend-api-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000
    },
    {
      name: 'garaadka-frontend',
      script: './frontend/server.js',
      cwd: '/home/garaadka',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/garaadka/frontend-error.log',
      out_file: '/var/log/garaadka/frontend-out.log',
      log_file: '/var/log/garaadka/frontend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000
    }
  ]
};
EOF

sudo chown garaadka:garaadka /home/garaadka/ecosystem.config.js

# Ensure backend dependencies are installed
print_status "📦 Installing backend dependencies..."
cd /home/garaadka/backend
sudo -u garaadka npm install

# Install tsx locally in backend if needed
if [ ! -f "node_modules/.bin/tsx" ]; then
    print_status "📦 Installing tsx locally in backend..."
    sudo -u garaadka npm install tsx --save-dev
fi

# Stop existing PM2 processes
print_status "🛑 Stopping existing PM2 processes..."
sudo -u garaadka pm2 delete all 2>/dev/null || true

# Start applications with new configuration
print_status "🚀 Starting applications with updated configuration..."
cd /home/garaadka
sudo -u garaadka pm2 start ecosystem.config.js

# Save PM2 configuration
sudo -u garaadka pm2 save

# Check status
print_status "📊 Checking PM2 status..."
sudo -u garaadka pm2 list

# Test backend API
print_status "🧪 Testing backend API..."
sleep 5

if curl -s http://localhost:5000/api/health > /dev/null; then
    print_success "✅ Backend API is responding"
    curl -s http://localhost:5000/api/health | jq . 2>/dev/null || curl -s http://localhost:5000/api/health
else
    print_error "❌ Backend API is not responding"
    print_status "Backend logs:"
    sudo -u garaadka pm2 logs garaadka-backend-api --lines 10
fi

# Test frontend
print_status "🧪 Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    print_success "✅ Frontend is responding"
else
    print_error "❌ Frontend is not responding"
    print_status "Frontend logs:"
    sudo -u garaadka pm2 logs garaadka-frontend --lines 10
fi

# Test through Nginx
print_status "🧪 Testing through Nginx..."
if curl -s http://localhost/api/health > /dev/null; then
    print_success "✅ Nginx proxy to backend is working"
else
    print_error "❌ Nginx proxy to backend is not working"
fi

if curl -s http://localhost > /dev/null; then
    print_success "✅ Nginx proxy to frontend is working"
else
    print_error "❌ Nginx proxy to frontend is not working"
fi

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
print_success "🎉 Backend API setup completed!"
print_status "Access your application:"
echo "  Frontend: http://$SERVER_IP"
echo "  Backend API: http://$SERVER_IP/api/health"
echo "  Direct Backend: http://$SERVER_IP:5000/api/health"
echo "  Direct Frontend: http://$SERVER_IP:3000"

print_status "📋 Useful commands:"
echo "  View PM2 status: sudo -u garaadka pm2 list"
echo "  View backend logs: sudo -u garaadka pm2 logs garaadka-backend-api"
echo "  View frontend logs: sudo -u garaadka pm2 logs garaadka-frontend"
echo "  Restart backend: sudo -u garaadka pm2 restart garaadka-backend-api"
echo "  Restart frontend: sudo -u garaadka pm2 restart garaadka-frontend"
EOF

# Make the script executable
chmod +x update-pm2-backend.sh

print_success "✅ PM2 backend update script created!"
print_status "Run this on your Ubuntu server: sudo ./update-pm2-backend.sh"