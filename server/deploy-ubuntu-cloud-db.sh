#!/bin/bash

# ========================================================================
# GARAADKA UBUNTU DEPLOYMENT WITH REMOTE CLOUD DATABASE
# Database: 47.236.39.181 (gwldb)
# ========================================================================

set -e

echo "🚀 Starting Garaadka Ubuntu Deployment with Cloud Database..."

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

# Test database connection first
print_status "Testing connection to cloud database at $DB_HOST..."
if mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "SELECT 1;" 2>/dev/null; then
    print_success "✅ Cloud database connection successful!"
    
    # Check if database exists
    if mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "USE $DB_NAME; SELECT 1;" 2>/dev/null; then
        print_success "✅ Database '$DB_NAME' is accessible"
        
        # Check tables
        TABLE_COUNT=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME -se "SHOW TABLES;" 2>/dev/null | wc -l)
        print_status "Database has $TABLE_COUNT tables"
    else
        print_warning "⚠️  Database '$DB_NAME' may not exist or is not accessible"
    fi
else
    print_error "❌ Cannot connect to cloud database at $DB_HOST"
    print_warning "Please verify:"
    echo "  1. Database server is running"
    echo "  2. Firewall allows connections from this server"
    echo "  3. Database credentials are correct"
    echo "  4. Network connectivity to $DB_HOST:$DB_PORT"
    
    read -p "Continue with deployment anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git nginx mysql-client ufw build-essential

# Install Node.js 18.x (if not already installed)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 already installed: $(pm2 --version)"
fi

# Create application user (if doesn't exist)
if ! id "garaadka" &>/dev/null; then
    print_status "Creating application user..."
    sudo useradd -m -s /bin/bash garaadka
    sudo usermod -aG sudo garaadka
fi

# Create necessary directories
print_status "Creating necessary directories..."
sudo mkdir -p /var/log/garaadka
sudo mkdir -p /var/backups/garaadka
sudo mkdir -p /etc/garaadka
sudo mkdir -p /var/www/garaadka
sudo mkdir -p /home/garaadka/app
sudo chown -R garaadka:garaadka /var/log/garaadka
sudo chown -R garaadka:garaadka /var/backups/garaadka
sudo chown -R garaadka:garaadka /var/www/garaadka
sudo chown -R garaadka:garaadka /home/garaadka/app

# Copy application files
print_status "Copying application files..."
sudo cp -r . /home/garaadka/app/
sudo chown -R garaadka:garaadka /home/garaadka/app/

# Copy the corrected environment file
print_status "Setting up production environment..."
sudo cp .env.production /etc/garaadka/
sudo chown garaadka:garaadka /etc/garaadka/.env.production
sudo chmod 600 /etc/garaadka/.env.production

# Switch to application directory
cd /home/garaadka/app

# Install dependencies
print_status "Installing Node.js dependencies..."
sudo -u garaadka npm install --production

# Build TypeScript
print_status "Building TypeScript..."
if [ -f "tsconfig.json" ]; then
    sudo -u garaadka npm run build
else
    print_warning "No tsconfig.json found, skipping TypeScript build"
fi

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
sudo -u garaadka tee /home/garaadka/app/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'garaadka-api',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    cwd: '/home/garaadka/app',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: '/etc/garaadka/.env.production',
    log_file: '/var/log/garaadka/combined.log',
    out_file: '/var/log/garaadka/out.log',
    error_file: '/var/log/garaadka/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    kill_timeout: 5000
  }]
};
EOF

# Create a frontend dashboard
print_status "Creating frontend dashboard..."
sudo tee /var/www/garaadka/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Garaadka Laundry Management System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 900px; 
            margin: 20px;
            background: white; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #333; font-size: 2.5em; margin-bottom: 10px; }
        .header p { color: #666; font-size: 1.1em; }
        .status { 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 8px; 
            border-left: 5px solid;
        }
        .success { 
            background: #d4edda; 
            color: #155724; 
            border-left-color: #28a745;
        }
        .info { 
            background: #d1ecf1; 
            color: #0c5460; 
            border-left-color: #17a2b8;
        }
        .warning { 
            background: #fff3cd; 
            color: #856404; 
            border-left-color: #ffc107;
        }
        .error { 
            background: #f8d7da; 
            color: #721c24; 
            border-left-color: #dc3545;
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin: 20px 0;
        }
        .card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 10px; 
            border: 1px solid #e9ecef;
        }
        .card h3 { color: #495057; margin-bottom: 10px; }
        .api-link { 
            color: #007bff; 
            text-decoration: none; 
            font-weight: 500;
        }
        .api-link:hover { text-decoration: underline; }
        .btn { 
            display: inline-block; 
            padding: 10px 20px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 5px;
        }
        .btn:hover { background: #0056b3; }
        .loading { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧺 Garaadka Laundry Management</h1>
            <p>Professional Laundry Management System</p>
        </div>

        <div class="status success">
            <strong>✅ Server is running successfully!</strong>
        </div>

        <div class="grid">
            <div class="card">
                <h3>🔗 API Information</h3>
                <p><strong>Base URL:</strong> <code id="baseUrl"></code></p>
                <p><strong>Environment:</strong> Production</p>
                <p><strong>Database:</strong> Cloud Database (47.236.39.181)</p>
            </div>

            <div class="card">
                <h3>🏥 System Health</h3>
                <div id="healthStatus" class="loading">
                    <p>🔄 Checking system health...</p>
                </div>
            </div>

            <div class="card">
                <h3>🗄️ Database Status</h3>
                <div id="dbStatus" class="loading">
                    <p>🔄 Checking database connection...</p>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>📡 API Endpoints</h3>
            <div class="grid">
                <div>
                    <h4>Core APIs</h4>
                    <p><a href="/api/health" class="api-link">Health Check</a></p>
                    <p><a href="/api/customers" class="api-link">Customers</a></p>
                    <p><a href="/api/orders" class="api-link">Orders</a></p>
                    <p><a href="/api/payments" class="api-link">Payments</a></p>
                </div>
                <div>
                    <h4>Additional APIs</h4>
                    <p><a href="/api/receipts" class="api-link">Receipts</a></p>
                    <p><a href="/api/register" class="api-link">Register</a></p>
                    <p><a href="/api/audit" class="api-link">Audit Logs</a></p>
                    <p><a href="/api/settings" class="api-link">Settings</a></p>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>📚 Documentation & Testing</h3>
            <p>Use the Postman collections in the project repository for API testing:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Garaadka-Complete-API-Testing.postman_collection.json</li>
                <li>Garaadka-Customers-API.postman_collection.json</li>
            </ul>
        </div>
    </div>

    <script>
        // Set base URL
        document.getElementById('baseUrl').textContent = window.location.origin;
        
        // Check API health
        fetch('/api/health')
            .then(response => response.text())
            .then(data => {
                document.getElementById('healthStatus').innerHTML = '<p>✅ API Health: ' + data + '</p>';
                document.getElementById('healthStatus').className = 'success';
            })
            .catch(error => {
                document.getElementById('healthStatus').innerHTML = '<p>❌ API Health Check Failed: ' + error.message + '</p>';
                document.getElementById('healthStatus').className = 'error';
            });

        // Check database by trying to fetch customers
        fetch('/api/customers')
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('HTTP ' + response.status);
            })
            .then(data => {
                document.getElementById('dbStatus').innerHTML = '<p>✅ Database Connected</p><p>Found ' + (data.length || 0) + ' customers</p>';
                document.getElementById('dbStatus').className = 'success';
            })
            .catch(error => {
                document.getElementById('dbStatus').innerHTML = '<p>⚠️ Database Connection Issue</p><p>' + error.message + '</p>';
                document.getElementById('dbStatus').className = 'warning';
            });
    </script>
</body>
</html>
EOF

# Configure Nginx
print_status "Configuring Nginx..."
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

        # Serve frontend static files
        root /var/www/garaadka;
        index index.html;
        try_files \$uri \$uri/ /index.html;
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
print_status "Testing Nginx configuration..."
sudo nginx -t

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw --force enable

# Start Nginx
print_status "Starting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Start the application with PM2
print_status "Starting Garaadka API with PM2..."
cd /home/garaadka/app
sudo -u garaadka pm2 start ecosystem.config.js

# Save PM2 configuration
print_status "Saving PM2 configuration..."
sudo -u garaadka pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
sudo env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u garaadka --hp /home/garaadka

# Test the deployment
print_status "Testing deployment..."
sleep 5

# Check if PM2 is running
if sudo -u garaadka pm2 list | grep -q "garaadka-api"; then
    print_success "✅ PM2 application is running"
else
    print_error "❌ PM2 application failed to start"
fi

# Check if Nginx is serving
if curl -s http://localhost/health > /dev/null; then
    print_success "✅ Nginx is serving correctly"
else
    print_error "❌ Nginx is not responding"
fi

# Check API health
if curl -s http://localhost/api/health > /dev/null; then
    print_success "✅ API is responding"
else
    print_warning "⚠️  API is not responding"
fi

# Final database connection test
print_status "Final database connection test..."
if mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME -e "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = '$DB_NAME';" 2>/dev/null; then
    print_success "✅ Database connection verified"
else
    print_warning "⚠️  Database connection needs verification"
fi

print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "====================="
echo "🌐 Frontend URL: http://$SERVER_IP"
echo "🔧 API Base URL: http://$SERVER_IP/api"
echo "🏥 Health Check: http://$SERVER_IP/api/health"
echo "🗄️  Database: $DB_HOST:$DB_PORT ($DB_NAME)"
echo ""
echo "🔧 Management Commands:"
echo "======================"
echo "- View logs: sudo -u garaadka pm2 logs garaadka-api"
echo "- Restart API: sudo -u garaadka pm2 restart garaadka-api"
echo "- Stop API: sudo -u garaadka pm2 stop garaadka-api"
echo "- Monitor: sudo -u garaadka pm2 monit"
echo "- Restart Nginx: sudo systemctl restart nginx"
echo ""
echo "📁 Important Paths:"
echo "=================="
echo "- App: /home/garaadka/app"
echo "- Config: /etc/garaadka/.env.production"
echo "- Logs: /var/log/garaadka/"
echo "- Frontend: /var/www/garaadka"