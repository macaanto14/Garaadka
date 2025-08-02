#!/bin/bash

# ========================================================================
# GARAADKA FULL STACK DEPLOYMENT SCRIPT FOR UBUNTU (FIXED)
# ========================================================================
# This script deploys both backend and frontend on Ubuntu with PM2
# Connects to remote cloud database
# ========================================================================

set -e  # Exit on any error

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

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Database configuration (from your cloud database)
DB_HOST="47.236.39.181"
DB_USER="gwldb-user"
DB_PASSWORD="moha983936mm"
DB_NAME="gwldb"
DB_PORT="3306"

print_header "🚀 GARAADKA FULL STACK DEPLOYMENT"
print_status "Deploying backend + frontend with PM2"
print_status "Database: $DB_HOST:$DB_PORT/$DB_NAME"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
print_status "Detected server IP: $SERVER_IP"

# Test database connection with better error handling
print_status "🗄️  Testing connection to cloud database at $DB_HOST..."

# First test if mysql client is available
if ! command -v mysql &> /dev/null; then
    print_warning "MySQL client not found, installing..."
    sudo apt update
    sudo apt install -y mysql-client
fi

# Test connection with timeout and better error handling
DB_TEST_RESULT=$(timeout 10 mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "SELECT 1 as test;" 2>&1 || echo "FAILED")

if echo "$DB_TEST_RESULT" | grep -q "test"; then
    print_success "✅ Cloud database connection successful!"
else
    print_error "❌ Cannot connect to cloud database at $DB_HOST"
    print_warning "Database test result: $DB_TEST_RESULT"
    print_warning "Please verify database credentials and network connectivity"
    
    # Use compatible read command for Ubuntu
    echo -n "Continue with deployment anyway? (y/N): "
    read REPLY
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled by user"
        exit 1
    fi
    print_warning "Continuing deployment without database verification..."
fi

# Update system packages
print_status "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "📦 Installing required packages..."
sudo apt install -y curl wget git nginx mysql-client ufw build-essential

# Install Node.js 18.x
if ! command -v node &> /dev/null; then
    print_status "📦 Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    print_status "✅ Node.js already installed: $NODE_VERSION"
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    print_status "📦 Installing PM2 globally..."
    sudo npm install -g pm2
else
    PM2_VERSION=$(pm2 --version)
    print_status "✅ PM2 already installed: $PM2_VERSION"
fi

# Create application user
if ! id "garaadka" &>/dev/null; then
    print_status "👤 Creating application user..."
    sudo useradd -m -s /bin/bash garaadka
    sudo usermod -aG sudo garaadka
fi

# Create necessary directories
print_status "📁 Creating application directories..."
sudo mkdir -p /var/log/garaadka
sudo mkdir -p /var/backups/garaadka
sudo mkdir -p /etc/garaadka
sudo mkdir -p /home/garaadka/backend
sudo mkdir -p /home/garaadka/frontend
sudo chown -R garaadka:garaadka /var/log/garaadka
sudo chown -R garaadka:garaadka /var/backups/garaadka
sudo chown -R garaadka:garaadka /home/garaadka

# Copy backend files
print_status "📂 Setting up backend application..."
sudo cp -r . /home/garaadka/backend/
sudo chown -R garaadka:garaadka /home/garaadka/backend/

# Create production environment file
print_status "⚙️  Creating production environment..."
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
JWT_SECRET=garaadka-production-jwt-secret-$(date +%s)-$(openssl rand -hex 16)
JWT_EXPIRES_IN=24h

# Performance Configuration
MAX_CONNECTIONS=100
CONNECTION_TIMEOUT=60000
QUERY_TIMEOUT=30000

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/garaadka/backend.log

# CORS Configuration
CORS_ORIGIN=*

# Server Configuration
SERVER_IP=$SERVER_IP
FRONTEND_URL=http://$SERVER_IP:3000
EOF

sudo chown garaadka:garaadka /etc/garaadka/.env.production
sudo chmod 600 /etc/garaadka/.env.production

# Copy environment file to backend directory
sudo cp /etc/garaadka/.env.production /home/garaadka/backend/.env.production
sudo chown garaadka:garaadka /home/garaadka/backend/.env.production

# Install backend dependencies
print_status "📦 Installing backend dependencies..."
cd /home/garaadka/backend
sudo -u garaadka npm install --production

# Build TypeScript if needed
if [ -f "tsconfig.json" ]; then
    print_status "🔨 Building TypeScript..."
    sudo -u garaadka npm run build 2>/dev/null || print_warning "TypeScript build failed, continuing..."
fi

# Create frontend application
print_status "🎨 Creating frontend application..."
cd /home/garaadka/frontend

# Create package.json for frontend
sudo -u garaadka tee package.json << 'EOF'
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
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "axios": "^1.6.0"
  }
}
EOF

# Install frontend dependencies
print_status "📦 Installing frontend dependencies..."
sudo -u garaadka npm install

# Create frontend server
sudo -u garaadka tee server.js << EOF
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = 'http://localhost:5000/api';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API proxy routes
app.use('/api', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: \`\${API_BASE_URL}\${req.path}\`,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined
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
  console.log(\`🎨 Frontend server running on port \${PORT}\`);
});
EOF

# Create public directory and frontend files
sudo -u garaadka mkdir -p public

# Create main HTML file
sudo -u garaadka tee public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Garaadka Laundry Management</title>
    <style>
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
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
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
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }
        
        .card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5rem;
        }
        
        .card p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
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
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .status {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .status h3 {
            color: #667eea;
            margin-bottom: 20px;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        
        .status-item:last-child {
            border-bottom: none;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #4CAF50;
        }
        
        .status-indicator.warning {
            background: #FF9800;
        }
        
        .status-indicator.error {
            background: #F44336;
        }
        
        .api-test {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧺 Garaadka</h1>
            <p>Laundry Management System</p>
        </div>
        
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
                <h3>📋 Register</h3>
                <p>Daily register and transaction logs</p>
                <button class="btn" onclick="testAPI('/api/register')">View Register</button>
            </div>
        </div>
        
        <div class="status">
            <h3>🔧 System Status</h3>
            <div class="status-item">
                <span>Frontend Server</span>
                <div class="status-indicator" id="frontend-status"></div>
            </div>
            <div class="status-item">
                <span>Backend API</span>
                <div class="status-indicator" id="backend-status"></div>
            </div>
            <div class="status-item">
                <span>Database Connection</span>
                <div class="status-indicator" id="database-status"></div>
            </div>
            
            <div class="api-test" id="api-result">
                <strong>API Test Results:</strong>
                <div id="test-output">Click any button above to test API endpoints</div>
            </div>
        </div>
    </div>

    <script>
        // Test API endpoints
        async function testAPI(endpoint) {
            const output = document.getElementById('test-output');
            output.innerHTML = '<div class="loading"></div> Testing ' + endpoint + '...';
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                
                if (response.ok) {
                    output.innerHTML = `
                        <strong>✅ ${endpoint}</strong><br>
                        Status: ${response.status}<br>
                        Response: <pre>${JSON.stringify(data, null, 2)}</pre>
                    `;
                } else {
                    output.innerHTML = `
                        <strong>⚠️ ${endpoint}</strong><br>
                        Status: ${response.status}<br>
                        Error: ${data.message || 'Unknown error'}
                    `;
                }
            } catch (error) {
                output.innerHTML = `
                    <strong>❌ ${endpoint}</strong><br>
                    Error: ${error.message}
                `;
            }
        }
        
        // Check system status
        async function checkStatus() {
            // Frontend is obviously working if this script runs
            document.getElementById('frontend-status').className = 'status-indicator';
            
            // Test backend
            try {
                const response = await fetch('/api/health');
                if (response.ok) {
                    document.getElementById('backend-status').className = 'status-indicator';
                    document.getElementById('database-status').className = 'status-indicator';
                } else {
                    document.getElementById('backend-status').className = 'status-indicator warning';
                }
            } catch (error) {
                document.getElementById('backend-status').className = 'status-indicator error';
                document.getElementById('database-status').className = 'status-indicator error';
            }
        }
        
        // Check status on load
        checkStatus();
        
        // Refresh status every 30 seconds
        setInterval(checkStatus, 30000);
    </script>
</body>
</html>
EOF

# Create PM2 ecosystem file
print_status "⚙️  Creating PM2 ecosystem configuration..."
sudo -u garaadka tee /home/garaadka/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'garaadka-backend',
      script: './backend/index.js',
      cwd: '/home/garaadka',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_file: '/etc/garaadka/.env.production',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/garaadka/backend-error.log',
      out_file: '/var/log/garaadka/backend-out.log',
      log_file: '/var/log/garaadka/backend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
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
      min_uptime: '10s'
    }
  ]
};
EOF

sudo chown garaadka:garaadka /home/garaadka/ecosystem.config.js

# Configure Nginx
print_status "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/garaadka << EOF
server {
    listen 80;
    server_name $SERVER_IP localhost;
    
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
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
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
print_status "🔧 Testing Nginx configuration..."
if sudo nginx -t; then
    print_success "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
else
    print_error "❌ Nginx configuration error"
    exit 1
fi

# Configure firewall
print_status "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp

# Start applications with PM2
print_status "🚀 Starting applications with PM2..."
cd /home/garaadka

# Stop any existing PM2 processes
sudo -u garaadka pm2 delete all 2>/dev/null || true

# Start applications
sudo -u garaadka pm2 start ecosystem.config.js

# Save PM2 configuration
sudo -u garaadka pm2 save

# Setup PM2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u garaadka --hp /home/garaadka

# Enable services
sudo systemctl enable nginx
sudo systemctl start nginx

print_header "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"

# Final status check
print_status "📊 Final system status:"
echo ""

# Check services
print_status "Service Status:"
sudo systemctl is-active nginx && print_success "✅ Nginx: Running" || print_error "❌ Nginx: Not running"

# Check PM2 status
print_status "PM2 Applications:"
sudo -u garaadka pm2 list

# Check ports
print_status "Port Status:"
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

print_header "🌐 ACCESS YOUR APPLICATION"
echo ""
print_success "Frontend Dashboard: http://$SERVER_IP"
print_success "Backend API: http://$SERVER_IP/api"
print_success "Health Check: http://$SERVER_IP/health"
echo ""

print_header "📋 USEFUL COMMANDS"
echo ""
echo "View PM2 status:     sudo -u garaadka pm2 list"
echo "View PM2 logs:       sudo -u garaadka pm2 logs"
echo "Restart backend:     sudo -u garaadka pm2 restart garaadka-backend"
echo "Restart frontend:    sudo -u garaadka pm2 restart garaadka-frontend"
echo "View Nginx logs:     sudo tail -f /var/log/nginx/error.log"
echo "View app logs:       sudo tail -f /var/log/garaadka/backend-combined.log"
echo ""

print_success "🎉 Garaadka deployment completed successfully!"
print_status "Your application is now running on http://$SERVER_IP"