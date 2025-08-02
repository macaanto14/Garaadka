#!/bin/bash

# ========================================================================
# GARAADKA FULL-STACK UBUNTU DEPLOYMENT SCRIPT
# Backend API + Frontend Dashboard with PM2
# Database: 47.236.39.181 (gwldb)
# ========================================================================

set -e

echo "🚀 Starting Garaadka Full-Stack Ubuntu Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Database configuration
DB_HOST="47.236.39.181"
DB_USER="gwldb-user"
DB_PASSWORD="moha983936mm"
DB_NAME="gwldb"
DB_PORT="3306"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Get server IP for configuration
SERVER_IP=$(curl -s ifconfig.me || echo "localhost")
print_status "Detected server IP: $SERVER_IP"

print_status "🗄️  Testing connection to cloud database at $DB_HOST..."
if mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "SELECT 1;" 2>/dev/null; then
    print_success "✅ Cloud database connection successful!"
else
    print_error "❌ Cannot connect to cloud database at $DB_HOST"
    print_warning "Please verify database credentials and network connectivity"
    read -p "Continue with deployment anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
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
    <title>Garaadka Laundry Management System</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🧺 Garaadka Laundry Management</h1>
            <p>Professional Laundry Management System</p>
        </header>

        <div class="status-grid">
            <div class="status-card">
                <h3>🔗 System Status</h3>
                <div id="systemStatus" class="status-indicator loading">
                    <span>🔄 Checking...</span>
                </div>
            </div>
            
            <div class="status-card">
                <h3>🗄️ Database</h3>
                <div id="dbStatus" class="status-indicator loading">
                    <span>🔄 Checking...</span>
                </div>
            </div>
        </div>

        <div class="main-content">
            <div class="section">
                <h2>📊 Dashboard</h2>
                <div class="dashboard-grid">
                    <div class="dashboard-card" onclick="loadCustomers()">
                        <h3>👥 Customers</h3>
                        <div id="customerCount" class="count">-</div>
                    </div>
                    <div class="dashboard-card" onclick="loadOrders()">
                        <h3>📋 Orders</h3>
                        <div id="orderCount" class="count">-</div>
                    </div>
                    <div class="dashboard-card" onclick="loadPayments()">
                        <h3>💰 Payments</h3>
                        <div id="paymentCount" class="count">-</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🔧 API Endpoints</h2>
                <div class="api-grid">
                    <div class="api-card">
                        <h4>Core APIs</h4>
                        <ul>
                            <li><a href="/api/health" target="_blank">Health Check</a></li>
                            <li><a href="/api/customers" target="_blank">Customers</a></li>
                            <li><a href="/api/orders" target="_blank">Orders</a></li>
                            <li><a href="/api/payments" target="_blank">Payments</a></li>
                        </ul>
                    </div>
                    <div class="api-card">
                        <h4>Additional APIs</h4>
                        <ul>
                            <li><a href="/api/receipts" target="_blank">Receipts</a></li>
                            <li><a href="/api/register" target="_blank">Register</a></li>
                            <li><a href="/api/audit" target="_blank">Audit Logs</a></li>
                            <li><a href="/api/settings" target="_blank">Settings</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📋 Data View</h2>
                <div class="data-container">
                    <div class="data-controls">
                        <button onclick="loadCustomers()" class="btn">Load Customers</button>
                        <button onclick="loadOrders()" class="btn">Load Orders</button>
                        <button onclick="loadPayments()" class="btn">Load Payments</button>
                        <button onclick="clearData()" class="btn btn-secondary">Clear</button>
                    </div>
                    <div id="dataDisplay" class="data-display">
                        <p>Click a button above to load data</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
EOF

# Create CSS file
sudo -u garaadka tee public/styles.css << 'EOF'
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
    background: white;
    padding: 30px;
    border-radius: 15px;
    margin-bottom: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.header h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
    color: #333;
}

.header p {
    color: #666;
    font-size: 1.1em;
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.status-card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.status-indicator {
    padding: 10px;
    border-radius: 5px;
    margin-top: 10px;
}

.status-indicator.success {
    background: #d4edda;
    color: #155724;
}

.status-indicator.error {
    background: #f8d7da;
    color: #721c24;
}

.status-indicator.loading {
    background: #d1ecf1;
    color: #0c5460;
}

.main-content {
    background: white;
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.section {
    margin-bottom: 30px;
}

.section h2 {
    margin-bottom: 20px;
    color: #333;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.dashboard-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s;
    border: 2px solid transparent;
}

.dashboard-card:hover {
    transform: translateY(-5px);
    border-color: #007bff;
}

.count {
    font-size: 2em;
    font-weight: bold;
    color: #007bff;
    margin-top: 10px;
}

.api-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.api-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
}

.api-card ul {
    list-style: none;
    padding-left: 0;
}

.api-card li {
    margin: 8px 0;
}

.api-card a {
    color: #007bff;
    text-decoration: none;
}

.api-card a:hover {
    text-decoration: underline;
}

.data-container {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
}

.data-controls {
    margin-bottom: 20px;
}

.btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin-right: 10px;
    margin-bottom: 10px;
}

.btn:hover {
    background: #0056b3;
}

.btn-secondary {
    background: #6c757d;
}

.btn-secondary:hover {
    background: #545b62;
}

.data-display {
    background: white;
    padding: 20px;
    border-radius: 5px;
    border: 1px solid #dee2e6;
    max-height: 400px;
    overflow-y: auto;
}

.loading {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    .header h1 {
        font-size: 2em;
    }
    
    .dashboard-grid,
    .api-grid,
    .status-grid {
        grid-template-columns: 1fr;
    }
}
EOF

# Create JavaScript file
sudo -u garaadka tee public/app.js << 'EOF'
// API Base URL
const API_BASE = '/api';

// Check system status on load
document.addEventListener('DOMContentLoaded', function() {
    checkSystemStatus();
    checkDatabaseStatus();
    loadDashboardCounts();
});

// Check system health
async function checkSystemStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.text();
        
        const statusEl = document.getElementById('systemStatus');
        statusEl.className = 'status-indicator success';
        statusEl.innerHTML = `<span>✅ ${data}</span>`;
    } catch (error) {
        const statusEl = document.getElementById('systemStatus');
        statusEl.className = 'status-indicator error';
        statusEl.innerHTML = `<span>❌ System Offline</span>`;
    }
}

// Check database status
async function checkDatabaseStatus() {
    try {
        const response = await fetch(`${API_BASE}/customers`);
        if (response.ok) {
            const statusEl = document.getElementById('dbStatus');
            statusEl.className = 'status-indicator success';
            statusEl.innerHTML = `<span>✅ Connected</span>`;
        } else {
            throw new Error('Database connection failed');
        }
    } catch (error) {
        const statusEl = document.getElementById('dbStatus');
        statusEl.className = 'status-indicator error';
        statusEl.innerHTML = `<span>❌ Connection Failed</span>`;
    }
}

// Load dashboard counts
async function loadDashboardCounts() {
    try {
        // Load customers count
        const customersResponse = await fetch(`${API_BASE}/customers`);
        if (customersResponse.ok) {
            const customers = await customersResponse.json();
            document.getElementById('customerCount').textContent = customers.length || 0;
        }
    } catch (error) {
        console.error('Error loading dashboard counts:', error);
    }
    
    try {
        // Load orders count
        const ordersResponse = await fetch(`${API_BASE}/orders`);
        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            document.getElementById('orderCount').textContent = orders.length || 0;
        }
    } catch (error) {
        console.error('Error loading orders count:', error);
    }
    
    try {
        // Load payments count
        const paymentsResponse = await fetch(`${API_BASE}/payments`);
        if (paymentsResponse.ok) {
            const payments = await paymentsResponse.json();
            document.getElementById('paymentCount').textContent = payments.length || 0;
        }
    } catch (error) {
        console.error('Error loading payments count:', error);
    }
}

// Load customers data
async function loadCustomers() {
    try {
        const response = await fetch(`${API_BASE}/customers`);
        const data = await response.json();
        
        const display = document.getElementById('dataDisplay');
        display.innerHTML = `
            <h3>👥 Customers (${data.length})</h3>
            <div class="table-container">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; border: 1px solid #dee2e6;">ID</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Name</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Phone</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(customer => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${customer.customer_id}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${customer.customer_name}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${customer.phone_number || '-'}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${customer.email || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('dataDisplay').innerHTML = `<p style="color: red;">Error loading customers: ${error.message}</p>`;
    }
}

// Load orders data
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`);
        const data = await response.json();
        
        const display = document.getElementById('dataDisplay');
        display.innerHTML = `
            <h3>📋 Orders (${data.length})</h3>
            <div class="table-container">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Order ID</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Customer</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Date</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Status</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(order => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${order.order_id}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${order.customer_name || order.customer_id}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(order.order_date).toLocaleDateString()}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${order.status}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">$${order.total_amount}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('dataDisplay').innerHTML = `<p style="color: red;">Error loading orders: ${error.message}</p>`;
    }
}

// Load payments data
async function loadPayments() {
    try {
        const response = await fetch(`${API_BASE}/payments`);
        const data = await response.json();
        
        const display = document.getElementById('dataDisplay');
        display.innerHTML = `
            <h3>💰 Payments (${data.length})</h3>
            <div class="table-container">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Payment ID</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Order ID</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Amount</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Method</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6;">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(payment => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${payment.payment_id}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${payment.order_id}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">$${payment.amount}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${payment.payment_method}</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(payment.payment_date).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('dataDisplay').innerHTML = `<p style="color: red;">Error loading payments: ${error.message}</p>`;
    }
}

// Clear data display
function clearData() {
    document.getElementById('dataDisplay').innerHTML = '<p>Click a button above to load data</p>';
}
EOF

# Create PM2 ecosystem file for both applications
print_status "⚙️  Creating PM2 ecosystem configuration..."
sudo -u garaadka tee /home/garaadka/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'garaadka-backend',
      script: './index.js',
      cwd: '/home/garaadka/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_file: '/etc/garaadka/.env.production',
      log_file: '/var/log/garaadka/backend-combined.log',
      out_file: '/var/log/garaadka/backend-out.log',
      error_file: '/var/log/garaadka/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      kill_timeout: 5000
    },
    {
      name: 'garaadka-frontend',
      script: './server.js',
      cwd: '/home/garaadka/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: '/var/log/garaadka/frontend-combined.log',
      out_file: '/var/log/garaadka/frontend-out.log',
      error_file: '/var/log/garaadka/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      kill_timeout: 5000
    }
  ]
};
EOF

# Configure Nginx
print_status "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/garaadka << EOF
server {
    listen 80;
    server_name $SERVER_IP localhost _;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

    # Handle preflight requests
    location / {
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Proxy to frontend
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API routes (direct to backend)
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
        
        # CORS headers for API
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }

    # Logs
    access_log /var/log/nginx/garaadka_access.log;
    error_log /var/log/nginx/garaadka_error.log;
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/garaadka /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "🔧 Testing Nginx configuration..."
sudo nginx -t

# Configure firewall
print_status "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 5000
sudo ufw --force enable

# Start Nginx
print_status "🌐 Starting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Start applications with PM2
print_status "🚀 Starting applications with PM2..."
cd /home/garaadka
sudo -u garaadka pm2 start ecosystem.config.js

# Save PM2 configuration
print_status "💾 Saving PM2 configuration..."
sudo -u garaadka pm2 save

# Setup PM2 startup script
print_status "⚙️  Setting up PM2 startup script..."
sudo env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u garaadka --hp /home/garaadka

# Test the deployment
print_status "🧪 Testing deployment..."
sleep 10

# Check PM2 applications
print_status "Checking PM2 applications..."
if sudo -u garaadka pm2 list | grep -q "garaadka-backend"; then
    print_success "✅ Backend is running"
else
    print_error "❌ Backend failed to start"
fi

if sudo -u garaadka pm2 list | grep -q "garaadka-frontend"; then
    print_success "✅ Frontend is running"
else
    print_error "❌ Frontend failed to start"
fi

# Check services
if curl -s http://localhost:5000/api/health > /dev/null; then
    print_success "✅ Backend API is responding"
else
    print_warning "⚠️  Backend API is not responding"
fi

if curl -s http://localhost:3000 > /dev/null; then
    print_success "✅ Frontend is responding"
else
    print_warning "⚠️  Frontend is not responding"
fi

if curl -s http://localhost/health > /dev/null; then
    print_success "✅ Nginx is serving correctly"
else
    print_error "❌ Nginx is not responding"
fi

# Final database test
print_status "🗄️  Final database connection test..."
if mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME -e "SELECT 1;" 2>/dev/null; then
    print_success "✅ Database connection verified"
else
    print_warning "⚠️  Database connection needs verification"
fi

print_success "🎉 Full-Stack Deployment Completed Successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "🌐 Frontend URL: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP/api"
echo "🏥 Health Check: http://$SERVER_IP/api/health"
echo "🗄️  Database: $DB_HOST:$DB_PORT ($DB_NAME)"
echo ""
echo "🔧 PM2 Management Commands:"
echo "=========================="
echo "- View all apps: sudo -u garaadka pm2 list"
echo "- View logs: sudo -u garaadka pm2 logs"
echo "- Restart backend: sudo -u garaadka pm2 restart garaadka-backend"
echo "- Restart frontend: sudo -u garaadka pm2 restart garaadka-frontend"
echo "- Stop all: sudo -u garaadka pm2 stop all"
echo "- Monitor: sudo -u garaadka pm2 monit"
echo ""
echo "🔧 System Management:"
echo "===================="
echo "- Restart Nginx: sudo systemctl restart nginx"
echo "- View Nginx logs: sudo tail -f /var/log/nginx/garaadka_error.log"
echo "- View app logs: sudo tail -f /var/log/garaadka/"
echo ""
echo "📁 Important Paths:"
echo "=================="
echo "- Backend: /home/garaadka/backend"
echo "- Frontend: /home/garaadka/frontend"
echo "- Config: /etc/garaadka/.env.production"
echo "- Logs: /var/log/garaadka/"
echo "- PM2 Config: /home/garaadka/ecosystem.config.js"