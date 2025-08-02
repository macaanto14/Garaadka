#!/bin/bash

# ========================================================================
# GARAADKA UBUNTU SERVER DEPLOYMENT SCRIPT
# ========================================================================

set -e

echo "🚀 Starting Garaadka Ubuntu Server Deployment..."

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git nginx mysql-client-core-8.0 ufw

# Install Node.js 18.x (if not already installed)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
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
sudo chown -R garaadka:garaadka /var/log/garaadka
sudo chown -R garaadka:garaadka /var/backups/garaadka

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install --production

# Build TypeScript``
print_status "Building TypeScript..."
npm run build

# Copy environment file
if [ -f ".env.production" ]; then
    print_status "Setting up environment configuration..."
    sudo cp .env.production /etc/garaadka/
    sudo chown garaadka:garaadka /etc/garaadka/.env.production
    sudo chmod 600 /etc/garaadka/.env.production
fi

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'garaadka-api',
    script: './index.js',
    instances: 'max',
    exec_mode: 'cluster',
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
    min_uptime: '10s'
  }]
};
EOF

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/garaadka << 'EOF'
server {
    listen 80;
    server_name 45.55.216.189;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

    # Handle preflight requests
    location / {
        if ($request_method = 'OPTIONS') {
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
        try_files $uri $uri/ /index.html;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
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
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/garaadka /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw --force enable

# Start services
print_status "Starting services..."
sudo systemctl restart nginx
sudo systemctl enable nginx

print_status "Deployment completed successfully!"
print_status "Next steps:"
echo "1. Start the application: pm2 start ecosystem.config.js"
echo "2. Save PM2 configuration: pm2 save && pm2 startup"
echo "3. Test API: curl http://45.55.216.189/api/health"
echo "4. Deploy frontend to /var/www/garaadka"
EOF

chmod +x deploy-ubuntu.sh