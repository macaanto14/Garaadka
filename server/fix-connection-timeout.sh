#!/bin/bash

# ========================================================================
# QUICK FIX FOR CONNECTION TIMEOUT ISSUES
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

print_status "🔧 Applying quick fixes for connection timeout..."

# 1. Ensure Nginx is configured correctly
print_status "Fixing Nginx configuration..."
sudo tee /etc/nginx/sites-available/garaadka << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    # Frontend (port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Backend API (port 5000)
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 2. Remove default site and enable our site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/garaadka /etc/nginx/sites-enabled/

# 3. Test and restart Nginx
if sudo nginx -t; then
    print_success "✅ Nginx configuration is valid"
    sudo systemctl restart nginx
    print_success "✅ Nginx restarted"
else
    print_error "❌ Nginx configuration error"
    exit 1
fi

# 4. Ensure firewall allows traffic
print_status "Configuring firewall..."
sudo ufw --force reset
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from any to any port 3000
sudo ufw allow from any to any port 5000

# 5. Restart PM2 applications
print_status "Restarting applications..."
cd /home/garaadka
sudo -u garaadka pm2 restart all
sudo -u garaadka pm2 save

# 6. Check if services are running
sleep 5
print_status "Checking service status..."

if systemctl is-active --quiet nginx; then
    print_success "✅ Nginx is running"
else
    print_error "❌ Nginx is not running"
fi

if netstat -tlnp | grep -q ":80 "; then
    print_success "✅ Port 80 is listening"
else
    print_error "❌ Port 80 is not listening"
fi

if netstat -tlnp | grep -q ":3000 "; then
    print_success "✅ Port 3000 (Frontend) is listening"
else
    print_error "❌ Port 3000 (Frontend) is not listening"
fi

if netstat -tlnp | grep -q ":5000 "; then
    print_success "✅ Port 5000 (Backend) is listening"
else
    print_error "❌ Port 5000 (Backend) is not listening"
fi

# 7. Test local connections
print_status "Testing local connections..."
curl -s http://localhost > /dev/null && print_success "✅ Local HTTP works" || print_error "❌ Local HTTP failed"

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
print_status "Server IP: $SERVER_IP"
print_success "🎉 Quick fixes applied! Try accessing http://$SERVER_IP again"

print_warning "If still not working, check your cloud provider's security groups/firewall settings"
print_warning "Ensure ports 80 and 443 are open for inbound traffic from 0.0.0.0/0"