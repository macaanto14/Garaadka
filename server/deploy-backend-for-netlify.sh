#!/bin/bash

# ========================================================================
# GARAADKA BACKEND DEPLOYMENT FOR NETLIFY FRONTEND
# ========================================================================
# This script deploys only the backend API server configured to work
# with the existing Netlify frontend at https://garaadka.netlify.app
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

# Configuration
GITHUB_REPO="https://github.com/macaanto14/Garaadka.git"
APP_USER="garaadka"
APP_DIR="/home/garaadka"
BACKEND_DIR="$APP_DIR/backend"
NETLIFY_URL="https://garaadka.netlify.app"

# Database Configuration (Cloud Database)
DB_HOST="64.227.158.26"
DB_USER="gwldb-user"
DB_PASSWORD="moha983936mm"
DB_NAME="gwldb"
DB_PORT="3306"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

print_status "🚀 Starting Garaadka Backend Deployment for Netlify"
echo "========================================================================="
echo "📦 Repository: $GITHUB_REPO"
echo "🌐 Netlify Frontend: $NETLIFY_URL"
echo "🗄️  Database: $DB_HOST:$DB_PORT"
echo "🖥️  Server IP: $SERVER_IP"
echo "🔗 Backend API will be: http://$SERVER_IP:5000"
echo "========================================================================="

# Test database connection first
print_status "🔍 Testing database connection..."
if command -v mysql >/dev/null 2>&1; then
    if timeout 10 mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "SELECT 1;" >/dev/null 2>&1; then
        print_success "✅ Database connection successful"
    else
        print_warning "⚠️ Database connection failed, but continuing deployment..."
    fi
else
    print_status "Installing MySQL client for database testing..."
    sudo apt-get update -qq
    sudo apt-get install -y mysql-client
    if timeout 10 mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "SELECT 1;" >/dev/null 2>&1; then
        print_success "✅ Database connection successful"
    else
        print_warning "⚠️ Database connection failed, but continuing deployment..."
    fi
fi

echo ""
read -p "Continue with backend deployment? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled by user"
    exit 1
fi

# Update system packages
print_status "📦 Updating system packages..."
sudo apt-get update -qq
sudo apt-get install -y curl wget git build-essential nginx

# Install Node.js 18.x
print_status "📦 Installing Node.js..."
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
print_status "📦 Installing PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
    sudo npm install -g pm2
fi

# Install tsx globally for TypeScript execution
print_status "📦 Installing tsx globally..."
sudo npm install -g tsx

# Create application user
print_status "👤 Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -m -s /bin/bash $APP_USER
    sudo usermod -aG sudo $APP_USER
fi

# Create directories
print_status "📁 Creating application directories..."
sudo mkdir -p $APP_DIR/backend
sudo mkdir -p /var/log/garaadka
sudo mkdir -p /etc/garaadka
sudo chown -R $APP_USER:$APP_USER $APP_DIR
sudo chown -R $APP_USER:$APP_USER /var/log/garaadka

# Clone/update repository
print_status "📥 Getting backend code from GitHub..."
cd $APP_DIR
if [ -d "Garaadka" ]; then
    print_status "Updating existing repository..."
    sudo -u $APP_USER git -C Garaadka pull
else
    print_status "Cloning repository..."
    sudo -u $APP_USER git clone $GITHUB_REPO
fi

# Copy backend files
print_status "📁 Setting up backend files..."
cd $APP_DIR/Garaadka

# Find backend source
BACKEND_SOURCE=""
if [ -d "server" ]; then
    BACKEND_SOURCE="server"
elif [ -d "backend" ]; then
    BACKEND_SOURCE="backend"
elif [ -d "api" ]; then
    BACKEND_SOURCE="api"
elif [ -f "package.json" ] && grep -q "express\|fastify\|koa" package.json; then
    BACKEND_SOURCE="."
fi

print_status "📂 Backend source: ${BACKEND_SOURCE:-'server directory'}"

if [ -n "$BACKEND_SOURCE" ]; then
    sudo -u $APP_USER cp -r $BACKEND_SOURCE/* $BACKEND_DIR/
else
    # Fallback to server directory
    sudo -u $APP_USER cp -r server/* $BACKEND_DIR/ 2>/dev/null || {
        print_error "❌ Could not find backend source files"
        exit 1
    }
fi

# Create production environment file optimized for Netlify
print_status "⚙️ Creating backend environment configuration for Netlify..."
sudo tee /etc/garaadka/.env.production << EOF
# ========================================================================
# GARAADKA PRODUCTION ENVIRONMENT - NETLIFY INTEGRATION
# ========================================================================

# Application Environment
NODE_ENV=production
PORT=5000

# Database Configuration (Cloud Database)
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_PORT=$DB_PORT

# CORS Configuration for Netlify
CORS_ORIGIN=https://garaadka.netlify.app,http://localhost:3000,http://localhost:5173,https://localhost:3000,https://localhost:5173,http://$SERVER_IP,https://$SERVER_IP,http://$SERVER_IP:5000,https://$SERVER_IP:5000

# Security Configuration
JWT_SECRET=garaadka_jwt_secret_production_netlify_2024
SESSION_SECRET=garaadka_session_secret_production_netlify_2024

# API Configuration
API_BASE_URL=http://$SERVER_IP:5000
API_VERSION=v1

# SSL Configuration
SSL_ENABLED=false
SSL_CERT_PATH=/etc/ssl/certs/garaadka.crt
SSL_KEY_PATH=/etc/ssl/private/garaadka.key

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/garaadka/app.log
ERROR_LOG_FILE=/var/log/garaadka/error.log

# Performance Configuration
MAX_CONNECTIONS=100
TIMEOUT=30000
KEEP_ALIVE_TIMEOUT=5000

# CORS Configuration Details
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH
CORS_HEADERS=Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers
CORS_CREDENTIALS=true

# Health Check Configuration
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/api/health

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Netlify Integration
NETLIFY_FRONTEND_URL=$NETLIFY_URL
FRONTEND_BUILD_HOOK_URL=
EOF

# Copy environment file to backend directory
sudo cp /etc/garaadka/.env.production $BACKEND_DIR/.env.production
sudo chown $APP_USER:$APP_USER $BACKEND_DIR/.env.production

# Install backend dependencies
print_status "📦 Installing backend dependencies..."
cd $BACKEND_DIR
sudo -u $APP_USER npm install

# Build TypeScript if needed
if [ -f "tsconfig.json" ]; then
    print_status "🔨 Building TypeScript backend..."
    sudo -u $APP_USER npm run build 2>/dev/null || print_warning "TypeScript build failed, will use tsx for runtime compilation"
fi

# Create start script wrapper for better PM2 compatibility
print_status "📝 Creating backend start script..."
sudo -u $APP_USER tee start-backend.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Garaadka Backend for Netlify...');
console.log('📁 Working directory:', __dirname);
console.log('🌐 Environment:', process.env.NODE_ENV);

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

# Create PM2 ecosystem configuration for backend only
print_status "⚙️ Creating PM2 configuration..."
sudo -u $APP_USER tee $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'garaadka-backend',
      script: 'start-backend.js',
      cwd: '$BACKEND_DIR',
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
      ignore_watch: ['node_modules', 'logs'],
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
EOF

# Configure Nginx for API only (no frontend)
print_status "🌐 Configuring Nginx for API..."
sudo tee /etc/nginx/sites-available/garaadka-api << EOF
server {
    listen 80;
    server_name $SERVER_IP;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # CORS headers for Netlify
    add_header 'Access-Control-Allow-Origin' 'https://garaadka.netlify.app' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # Handle preflight requests
    if (\$request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://garaadka.netlify.app' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        
        # Additional CORS headers for API
        add_header 'Access-Control-Allow-Origin' 'https://garaadka.netlify.app' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/api/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Root redirect to Netlify frontend
    location / {
        return 301 https://garaadka.netlify.app\$request_uri;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/garaadka-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if sudo nginx -t; then
    print_success "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
else
    print_error "❌ Nginx configuration error"
    exit 1
fi

# Configure UFW firewall
print_status "🔥 Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw --force enable

# Start backend with PM2
print_status "🚀 Starting backend with PM2..."
cd $APP_DIR

# Stop any existing processes
sudo -u $APP_USER pm2 delete all 2>/dev/null || true

# Start the backend
sudo -u $APP_USER pm2 start ecosystem.config.js
sudo -u $APP_USER pm2 save
sudo -u $APP_USER pm2 startup | grep -E '^sudo' | sudo bash || true

# Wait for backend to start
print_status "⏳ Waiting for backend to start..."
sleep 10

# Test backend deployment
print_status "🧪 Testing backend deployment..."

# Test PM2 status
if sudo -u $APP_USER pm2 list | grep -q "garaadka-backend.*online"; then
    print_success "✅ Backend is running in PM2"
else
    print_error "❌ Backend failed to start in PM2"
    sudo -u $APP_USER pm2 logs garaadka-backend --lines 20
    exit 1
fi

# Test direct backend connection
if curl -s http://localhost:5000/api/health >/dev/null; then
    print_success "✅ Backend API responding on port 5000"
else
    print_warning "⚠️ Backend API not responding on port 5000"
fi

# Test through Nginx
if curl -s http://localhost/api/health >/dev/null; then
    print_success "✅ Backend API accessible through Nginx"
else
    print_warning "⚠️ Backend API not accessible through Nginx"
fi

# Test external access
if curl -s http://$SERVER_IP/api/health >/dev/null; then
    print_success "✅ Backend API accessible externally"
else
    print_warning "⚠️ Backend API not accessible externally"
fi

# Show deployment summary
echo ""
echo "========================================================================="
print_success "🎉 BACKEND DEPLOYMENT COMPLETE!"
echo "========================================================================="
echo "🌐 Netlify Frontend: $NETLIFY_URL"
echo "🔗 Backend API URL: http://$SERVER_IP/api"
echo "🏥 Health Check: http://$SERVER_IP/health"
echo "📊 Direct API: http://$SERVER_IP:5000/api"
echo ""
echo "📋 API Endpoints for your Netlify app:"
echo "  GET  http://$SERVER_IP/api/health          # Health check"
echo "  POST http://$SERVER_IP/api/auth/login      # Authentication"
echo "  GET  http://$SERVER_IP/api/customers       # Customers"
echo "  GET  http://$SERVER_IP/api/orders          # Orders"
echo "  GET  http://$SERVER_IP/api/payments        # Payments"
echo "  GET  http://$SERVER_IP/api/receipts        # Receipts"
echo ""
echo "🔧 Management Commands:"
echo "  pm2 list                           # View processes"
echo "  pm2 logs garaadka-backend         # View logs"
echo "  pm2 restart garaadka-backend      # Restart backend"
echo "  pm2 monit                         # Monitor processes"
echo ""
echo "🌐 Update your Netlify app to use: http://$SERVER_IP/api"
echo "✅ CORS is configured for: $NETLIFY_URL"
echo "========================================================================="

# Create a simple test script for the API
sudo -u $APP_USER tee $APP_DIR/test-api.sh << EOF
#!/bin/bash
echo "🧪 Testing Garaadka API for Netlify..."
echo "========================================="

echo "1. Health Check:"
curl -s http://localhost:5000/api/health | jq . || curl -s http://localhost:5000/api/health

echo -e "\n2. External Health Check:"
curl -s http://$SERVER_IP/api/health | jq . || curl -s http://$SERVER_IP/api/health

echo -e "\n3. Through Nginx:"
curl -s http://$SERVER_IP/health | jq . || curl -s http://$SERVER_IP/health

echo -e "\n4. CORS Test (simulating Netlify):"
curl -s -H "Origin: https://garaadka.netlify.app" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS http://$SERVER_IP/api/health

echo -e "\n========================================="
echo "✅ API testing complete!"
EOF

sudo chmod +x $APP_DIR/test-api.sh

print_status "🧪 You can test the API anytime with: $APP_DIR/test-api.sh"