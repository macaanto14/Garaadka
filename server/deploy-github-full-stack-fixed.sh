#!/bin/bash

# ========================================================================
# GARAADKA FULL-STACK DEPLOYMENT FROM GITHUB (FIXED)
# ========================================================================
# This script deploys both frontend and backend from GitHub repository
# to an Ubuntu server with PM2 and connects to cloud database
# Fixed: PM2 + TypeScript execution issues
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
FRONTEND_DIR="$APP_DIR/frontend"

# Database Configuration (Cloud Database)
DB_HOST="47.236.39.181"
DB_USER="gwldb-user"
DB_PASSWORD="moha983936mm"
DB_NAME="gwldb"
DB_PORT="3306"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

print_status "🚀 Starting Garaadka Full-Stack Deployment from GitHub (Fixed)"
echo "========================================================================="
echo "📦 Repository: $GITHUB_REPO"
echo "🗄️  Database: $DB_HOST:$DB_PORT"
echo "🖥️  Server IP: $SERVER_IP"
echo "========================================================================="

# Stop any existing PM2 processes first
print_status "🛑 Stopping existing PM2 processes..."
sudo -u $APP_USER pm2 delete all 2>/dev/null || true
sudo -u $APP_USER pm2 kill 2>/dev/null || true

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
read -p "Continue with deployment? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled by user"
    exit 1
fi

# Update system packages
print_status "📦 Updating system packages..."
sudo apt-get update -qq
sudo apt-get install -y curl wget git build-essential

# Install Node.js 18.x
print_status "📦 Installing Node.js..."
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
print_status "📦 Installing PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
    sudo npm install -g pm2@latest
fi

# Create application user
print_status "👤 Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -m -s /bin/bash $APP_USER
    sudo usermod -aG sudo $APP_USER
fi

# Create directories
print_status "📁 Creating application directories..."
sudo mkdir -p $APP_DIR/{backend,frontend}
sudo mkdir -p /var/log/garaadka
sudo mkdir -p /etc/garaadka
sudo chown -R $APP_USER:$APP_USER $APP_DIR
sudo chown -R $APP_USER:$APP_USER /var/log/garaadka

# Clone repository
print_status "📥 Cloning repository from GitHub..."
cd $APP_DIR
if [ -d "Garaadka" ]; then
    print_status "Repository already exists, updating..."
    sudo -u $APP_USER git -C Garaadka pull
else
    sudo -u $APP_USER git clone $GITHUB_REPO
fi

# Identify frontend and backend directories in the repo
print_status "🔍 Analyzing repository structure..."
cd $APP_DIR/Garaadka

# Check for common frontend directories
FRONTEND_SOURCE=""
BACKEND_SOURCE=""

if [ -d "frontend" ]; then
    FRONTEND_SOURCE="frontend"
elif [ -d "client" ]; then
    FRONTEND_SOURCE="client"
elif [ -d "web" ]; then
    FRONTEND_SOURCE="web"
elif [ -d "ui" ]; then
    FRONTEND_SOURCE="ui"
elif [ -f "package.json" ] && grep -q "react\|vue\|angular\|vite" package.json; then
    FRONTEND_SOURCE="."
fi

if [ -d "backend" ]; then
    BACKEND_SOURCE="backend"
elif [ -d "server" ]; then
    BACKEND_SOURCE="server"
elif [ -d "api" ]; then
    BACKEND_SOURCE="api"
elif [ -f "package.json" ] && grep -q "express\|fastify\|koa" package.json; then
    BACKEND_SOURCE="."
fi

print_status "📂 Frontend source: ${FRONTEND_SOURCE:-'Not found, will create basic frontend'}"
print_status "📂 Backend source: ${BACKEND_SOURCE:-'Not found, will use current server'}"

# Setup Backend
print_status "🔧 Setting up backend..."
if [ -n "$BACKEND_SOURCE" ]; then
    sudo -u $APP_USER cp -r $BACKEND_SOURCE/* $BACKEND_DIR/
else
    # Use the current server directory as fallback
    sudo -u $APP_USER cp -r /c/Garaadka/server/* $BACKEND_DIR/ 2>/dev/null || true
fi

# Create production environment file for backend
print_status "⚙️ Creating backend environment configuration..."
sudo tee /etc/garaadka/.env.production << EOF
# ========================================================================
# GARAADKA PRODUCTION ENVIRONMENT
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

# Security Configuration
JWT_SECRET=garaadka_jwt_secret_production_2024
SESSION_SECRET=garaadka_session_secret_production_2024

# SSL Configuration
SSL_ENABLED=false
SSL_CERT_PATH=/etc/ssl/certs/garaadka.crt
SSL_KEY_PATH=/etc/ssl/private/garaadka.key

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_PATH=/var/backups/garaadka

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/garaadka/app.log
ERROR_LOG_FILE=/var/log/garaadka/error.log

# Performance Configuration
MAX_CONNECTIONS=100
TIMEOUT=30000
KEEP_ALIVE_TIMEOUT=5000

# CORS Configuration
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-Requested-With

# Monitoring Configuration
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true

# Redis Configuration (if needed)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Ubuntu Server Specific
UBUNTU_USER=ubuntu
UBUNTU_HOME=/home/ubuntu
EOF

# Copy environment file to backend directory
sudo cp /etc/garaadka/.env.production $BACKEND_DIR/.env.production
sudo chown $APP_USER:$APP_USER $BACKEND_DIR/.env.production

# Install backend dependencies
print_status "📦 Installing backend dependencies..."
cd $BACKEND_DIR

# Install tsx locally in the project
sudo -u $APP_USER npm install
sudo -u $APP_USER npm install tsx --save-dev

# Create a startup script for the backend that handles TypeScript properly
print_status "📝 Creating backend startup script..."
sudo -u $APP_USER tee start-backend.js << 'EOF'
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Use the local tsx installation
const tsxPath = path.join(__dirname, 'node_modules', '.bin', 'tsx');
const indexPath = path.join(__dirname, 'index.ts');

console.log('🚀 Starting Garaadka Backend with tsx...');
console.log('tsx path:', tsxPath);
console.log('index.ts path:', indexPath);

const child = spawn(tsxPath, [indexPath], {
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

sudo chmod +x $BACKEND_DIR/start-backend.js

# Build TypeScript if tsconfig.json exists
if [ -f "tsconfig.json" ]; then
    print_status "🔨 Building TypeScript backend..."
    sudo -u $APP_USER npm run build 2>/dev/null || print_warning "TypeScript build failed, will use tsx for runtime compilation"
fi

# Setup Frontend
print_status "🎨 Setting up frontend..."
if [ -n "$FRONTEND_SOURCE" ] && [ "$FRONTEND_SOURCE" != "." ]; then
    sudo -u $APP_USER cp -r $APP_DIR/Garaadka/$FRONTEND_SOURCE/* $FRONTEND_DIR/
    cd $FRONTEND_DIR
    
    # Install frontend dependencies
    if [ -f "package.json" ]; then
        print_status "📦 Installing frontend dependencies..."
        sudo -u $APP_USER npm install
        
        # Build frontend if build script exists
        if grep -q '"build"' package.json; then
            print_status "🔨 Building frontend..."
            sudo -u $APP_USER npm run build
        fi
    fi
else
    # Create a basic frontend that connects to the backend API
    print_status "🎨 Creating basic frontend dashboard..."
    cd $FRONTEND_DIR
    
    # Create package.json for frontend
    sudo -u $APP_USER tee package.json << 'EOF'
{
  "name": "garaadka-frontend",
  "version": "1.0.0",
  "description": "Garaadka Laundry Management Frontend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.6.0"
  }
}
EOF

    # Install frontend dependencies
    sudo -u $APP_USER npm install

    # Create frontend server
    sudo -u $APP_USER tee server.js << 'EOF'
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

app.use(express.static('public'));
app.use(express.json());

// API proxy routes
app.use('/api', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${API_BASE_URL}${req.originalUrl}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('API Proxy Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'API request failed',
      message: error.message
    });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎨 Frontend server running on port ${PORT}`);
});
EOF

    # Create public directory and basic frontend
    sudo -u $APP_USER mkdir -p public
    
    # Create main HTML file
    sudo -u $APP_USER tee public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Garaadka Laundry Management</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🧺 Garaadka</h1>
            <p>Laundry Management System</p>
        </header>
        
        <div class="dashboard">
            <div class="card">
                <h3>📊 Dashboard</h3>
                <p>View orders, customers, and business analytics</p>
                <button class="btn" onclick="testAPI('/api/orders')">View Orders</button>
            </div>
            
            <div class="card">
                <h3>👥 Customers</h3>
                <p>Manage customer information and history</p>
                <button class="btn" onclick="testAPI('/api/customers')">View Customers</button>
            </div>
            
            <div class="card">
                <h3>💰 Payments</h3>
                <p>Track payments and financial records</p>
                <button class="btn" onclick="testAPI('/api/payments')">View Payments</button>
            </div>
            
            <div class="card">
                <h3>🧾 Receipts</h3>
                <p>Generate and manage receipts</p>
                <button class="btn" onclick="testAPI('/api/receipts')">View Receipts</button>
            </div>
        </div>
        
        <div class="api-test">
            <h3>🔧 API Test</h3>
            <div id="api-result"></div>
        </div>
    </div>
    
    <script src="app.js"></script>
</body>
</html>
EOF

    # Create CSS file
    sudo -u $APP_USER tee public/styles.css << 'EOF'
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 40px;
    color: white;
}

header h1 {
    font-size: 3rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

header p {
    font-size: 1.2rem;
    opacity: 0.9;
}

.dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.card {
    background: white;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
}

.card h3 {
    font-size: 1.5rem;
    margin-bottom: 15px;
    color: #667eea;
}

.card p {
    margin-bottom: 20px;
    color: #666;
    line-height: 1.6;
}

.btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
    width: 100%;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.api-test {
    background: white;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.api-test h3 {
    margin-bottom: 20px;
    color: #667eea;
}

#api-result {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid #667eea;
    font-family: 'Courier New', monospace;
    white-space: pre-wrap;
    max-height: 400px;
    overflow-y: auto;
}

.status {
    padding: 10px;
    border-radius: 5px;
    margin: 10px 0;
}

.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.info {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}
EOF

    # Create JavaScript file
    sudo -u $APP_USER tee public/app.js << 'EOF'
async function testAPI(endpoint) {
    const resultDiv = document.getElementById('api-result');
    resultDiv.innerHTML = `<div class="info">Testing ${endpoint}...</div>`;
    
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (response.ok) {
            resultDiv.innerHTML = `
                <div class="success">✅ Success (${response.status})</div>
                <div><strong>Endpoint:</strong> ${endpoint}</div>
                <div><strong>Response:</strong></div>
                <div>${JSON.stringify(data, null, 2)}</div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="error">❌ Error (${response.status})</div>
                <div><strong>Endpoint:</strong> ${endpoint}</div>
                <div><strong>Error:</strong></div>
                <div>${JSON.stringify(data, null, 2)}</div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="error">❌ Network Error</div>
            <div><strong>Endpoint:</strong> ${endpoint}</div>
            <div><strong>Error:</strong> ${error.message}</div>
        `;
    }
}

// Test health endpoint on page load
document.addEventListener('DOMContentLoaded', () => {
    testAPI('/api/health');
});
EOF
fi

# Create PM2 ecosystem file (FIXED VERSION)
print_status "⚙️ Creating PM2 configuration (Fixed)..."
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
      env_file: '$BACKEND_DIR/.env.production',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/garaadka/backend-error.log',
      out_file: '/var/log/garaadka/backend-out.log',
      log_file: '/var/log/garaadka/backend-combined.log',
      time: true,
      autorestart: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000
    },
    {
      name: 'garaadka-frontend',
      script: 'server.js',
      cwd: '$FRONTEND_DIR',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        API_BASE_URL: 'http://localhost:5000'
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
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000
    }
  ]
};
EOF

# Install and configure Nginx
print_status "🌐 Installing and configuring Nginx..."
sudo apt-get install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/garaadka << EOF
server {
    listen 80;
    server_name $SERVER_IP localhost;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Backend API (port 5000)
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        
        # CORS headers for API
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/garaadka /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Configure firewall
print_status "🔥 Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw --force enable

# Start PM2 applications
print_status "🚀 Starting PM2 applications..."
cd $APP_DIR
sudo -u $APP_USER pm2 start ecosystem.config.js

# Save PM2 configuration
print_status "💾 Saving PM2 configuration..."
sudo -u $APP_USER pm2 save

# Setup PM2 startup script
print_status "⚙️ Setting up PM2 startup script..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $APP_USER --hp $APP_DIR

# Start Nginx
print_status "🌐 Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# Test the deployment
print_status "🧪 Testing deployment..."
sleep 15

# Check services
print_status "Checking services..."

# Check PM2 applications
if sudo -u $APP_USER pm2 list | grep -q "garaadka-backend.*online"; then
    print_success "✅ Backend: Running"
else
    print_warning "⚠️ Backend: Not running"
    print_status "Backend logs:"
    sudo -u $APP_USER pm2 logs garaadka-backend --lines 10 || true
fi

if sudo -u $APP_USER pm2 list | grep -q "garaadka-frontend.*online"; then
    print_success "✅ Frontend: Running"
else
    print_warning "⚠️ Frontend: Not running"
    print_status "Frontend logs:"
    sudo -u $APP_USER pm2 logs garaadka-frontend --lines 10 || true
fi

# Check ports
if netstat -tlnp | grep -q ":80 "; then
    print_success "✅ Port 80 (HTTP): Open"
else
    print_warning "⚠️ Port 80 (HTTP): Not listening"
fi

if netstat -tlnp | grep -q ":3000 "; then
    print_success "✅ Port 3000 (Frontend): Open"
else
    print_warning "⚠️ Port 3000 (Frontend): Not listening"
fi

if netstat -tlnp | grep -q ":5000 "; then
    print_success "✅ Port 5000 (Backend): Open"
else
    print_warning "⚠️ Port 5000 (Backend): Not listening"
fi

# Test API endpoints
print_status "Testing API endpoints..."
if curl -s http://localhost:5000/api/health >/dev/null; then
    print_success "✅ Backend API: Responding"
else
    print_warning "⚠️ Backend API: Not responding"
fi

if curl -s http://localhost:3000 >/dev/null; then
    print_success "✅ Frontend: Responding"
else
    print_warning "⚠️ Frontend: Not responding"
fi

# Test database connection
print_status "Testing database connection..."
if timeout 10 mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "SELECT 1;" >/dev/null 2>&1; then
    print_success "✅ Database: Connected"
else
    print_warning "⚠️ Database: Connection failed"
fi

print_success "🎉 GitHub Full-Stack Deployment Completed (Fixed)!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "🌐 Frontend URL: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP/api"
echo "🏥 Health Check: http://$SERVER_IP/health"
echo "🗄️ Database: $DB_HOST:$DB_PORT ($DB_NAME)"
echo "📂 Repository: $GITHUB_REPO"
echo ""
echo "📁 File Locations:"
echo "=================="
echo "- Frontend: $FRONTEND_DIR"
echo "- Backend: $BACKEND_DIR"
echo "- Config: /etc/garaadka/.env.production"
echo "- Logs: /var/log/garaadka/"
echo "- PM2 Config: $APP_DIR/ecosystem.config.js"
echo "- Backend Starter: $BACKEND_DIR/start-backend.js"
echo ""
echo "🔧 Management Commands:"
echo "======================"
echo "- View PM2 status: sudo -u $APP_USER pm2 status"
echo "- View logs: sudo -u $APP_USER pm2 logs"
echo "- Restart apps: sudo -u $APP_USER pm2 restart all"
echo "- Update from GitHub: cd $APP_DIR/Garaadka && sudo -u $APP_USER git pull"
echo "- Nginx status: sudo systemctl status nginx"
echo "- Nginx restart: sudo systemctl restart nginx"
echo ""
print_success "✨ Your Garaadka application is now live!"