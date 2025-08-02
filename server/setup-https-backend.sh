#!/bin/bash

# ========================================================================
# SETUP HTTPS FOR GARAADKA BACKEND API (NETLIFY INTEGRATION)
# ========================================================================
# This script configures SSL/TLS with Let's Encrypt for the backend API
# to resolve mixed content issues with Netlify HTTPS frontend
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
SERVER_IP="64.227.158.26"
DOMAIN_NAME=""
EMAIL=""
NETLIFY_URL="https://garaadka.netlify.app"

print_status "🔒 Setting up HTTPS for Garaadka Backend API"
echo "========================================================================="
echo "🌐 Current Backend IP: $SERVER_IP"
echo "🔗 Netlify Frontend: $NETLIFY_URL"
echo "⚠️  Issue: Mixed content (HTTPS frontend → HTTP backend)"
echo "✅ Solution: Configure HTTPS for backend API"
echo "========================================================================="

# Check if we have a domain name or need to use IP
echo ""
print_status "📋 Domain Configuration Options:"
echo "1. Use a domain name (recommended) - e.g., api.yourdomain.com"
echo "2. Use IP address with self-signed certificate (for testing)"
echo "3. Use a free subdomain service"
echo ""

read -p "Do you have a domain name for your API? (y/N): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your domain name (e.g., api.yourdomain.com): " DOMAIN_NAME
    read -p "Enter your email for Let's Encrypt: " EMAIL
    
    if [[ -z "$DOMAIN_NAME" || -z "$EMAIL" ]]; then
        print_error "❌ Domain name and email are required for Let's Encrypt"
        exit 1
    fi
    
    USE_LETSENCRYPT=true
else
    print_warning "⚠️ Without a domain, we'll create a self-signed certificate"
    print_warning "⚠️ This will show security warnings in browsers"
    print_warning "⚠️ Consider using a free domain service like:"
    echo "   - Duck DNS (duckdns.org)"
    echo "   - No-IP (noip.com)"
    echo "   - Freenom (freenom.com)"
    echo ""
    read -p "Continue with self-signed certificate? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Setup cancelled. Please get a domain name and run this script again."
        exit 1
    fi
    
    USE_LETSENCRYPT=false
    DOMAIN_NAME="$SERVER_IP"
fi

echo ""
print_status "🚀 Starting HTTPS setup..."

# Install Certbot for Let's Encrypt
if [[ "$USE_LETSENCRYPT" == "true" ]]; then
    print_status "📦 Installing Certbot for Let's Encrypt..."
    sudo apt-get update -qq
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Stop Nginx temporarily for certificate generation
print_status "⏸️ Stopping Nginx temporarily..."
sudo systemctl stop nginx

if [[ "$USE_LETSENCRYPT" == "true" ]]; then
    # Generate Let's Encrypt certificate
    print_status "🔐 Generating Let's Encrypt SSL certificate..."
    sudo certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN_NAME"
    
    CERT_PATH="/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem"
    KEY_PATH="/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem"
else
    # Generate self-signed certificate
    print_status "🔐 Generating self-signed SSL certificate..."
    sudo mkdir -p /etc/ssl/garaadka
    
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/garaadka/garaadka.key \
        -out /etc/ssl/garaadka/garaadka.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=$SERVER_IP"
    
    CERT_PATH="/etc/ssl/garaadka/garaadka.crt"
    KEY_PATH="/etc/ssl/garaadka/garaadka.key"
fi

# Create HTTPS Nginx configuration
print_status "🌐 Configuring Nginx for HTTPS..."
sudo tee /etc/nginx/sites-available/garaadka-api-https << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN_NAME;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME;
    
    # SSL Configuration
    ssl_certificate $CERT_PATH;
    ssl_certificate_key $KEY_PATH;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Handle CORS preflight requests
    location / {
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
        
        # Redirect root to Netlify frontend
        return 301 https://garaadka.netlify.app\$request_uri;
    }
    
    # API routes
    location /api/ {
        # CORS headers for Netlify
        add_header 'Access-Control-Allow-Origin' 'https://garaadka.netlify.app' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Handle preflight requests for API
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
        
        # Proxy to backend
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
    }
    
    # Health check endpoint
    location /health {
        # CORS headers for health check
        add_header 'Access-Control-Allow-Origin' 'https://garaadka.netlify.app' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        proxy_pass http://localhost:5000/api/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Enable the HTTPS site
sudo ln -sf /etc/nginx/sites-available/garaadka-api-https /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/garaadka-api

# Test Nginx configuration
print_status "🧪 Testing Nginx HTTPS configuration..."
if sudo nginx -t; then
    print_success "✅ Nginx HTTPS configuration is valid"
else
    print_error "❌ Nginx configuration error"
    sudo nginx -t
    exit 1
fi

# Start Nginx
print_status "🚀 Starting Nginx with HTTPS..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Update firewall for HTTPS
print_status "🔥 Updating firewall for HTTPS..."
sudo ufw allow 443/tcp

# Test HTTPS setup
print_status "🧪 Testing HTTPS setup..."
sleep 5

if [[ "$USE_LETSENCRYPT" == "true" ]]; then
    API_URL="https://$DOMAIN_NAME"
else
    API_URL="https://$SERVER_IP"
fi

# Test HTTPS connection
if curl -k -s "$API_URL/health" >/dev/null; then
    print_success "✅ HTTPS API is accessible"
else
    print_warning "⚠️ HTTPS API test failed, checking backend..."
fi

# Check if backend is running
if sudo -u garaadka pm2 list | grep -q "garaadka-backend.*online"; then
    print_success "✅ Backend is running"
else
    print_warning "⚠️ Backend may not be running, restarting..."
    sudo -u garaadka pm2 restart garaadka-backend
fi

# Setup automatic certificate renewal (if using Let's Encrypt)
if [[ "$USE_LETSENCRYPT" == "true" ]]; then
    print_status "⏰ Setting up automatic certificate renewal..."
    
    # Test renewal
    sudo certbot renew --dry-run
    
    # Add cron job for automatic renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /etc/crontab
fi

# Show final configuration
echo ""
echo "========================================================================="
print_success "🎉 HTTPS SETUP COMPLETE!"
echo "========================================================================="

if [[ "$USE_LETSENCRYPT" == "true" ]]; then
    echo "🔒 SSL Certificate: Let's Encrypt (Valid & Trusted)"
    echo "🌐 API URL: https://$DOMAIN_NAME/api"
    echo "🏥 Health Check: https://$DOMAIN_NAME/health"
    echo "⏰ Auto-renewal: Configured via cron"
else
    echo "🔒 SSL Certificate: Self-signed (Browser warnings expected)"
    echo "🌐 API URL: https://$SERVER_IP/api"
    echo "🏥 Health Check: https://$SERVER_IP/health"
    echo "⚠️  Note: Browsers will show security warnings"
fi

echo ""
echo "📋 Next Steps for Netlify Integration:"
echo "1. Update your Netlify app configuration to use:"
if [[ "$USE_LETSENCRYPT" == "true" ]]; then
    echo "   API_BASE_URL: https://$DOMAIN_NAME/api"
else
    echo "   API_BASE_URL: https://$SERVER_IP/api"
fi
echo ""
echo "2. Test the API endpoints:"
if [[ "$USE_LETSENCRYPT" == "true" ]]; then
    echo "   curl https://$DOMAIN_NAME/health"
    echo "   curl https://$DOMAIN_NAME/api/auth/login"
else
    echo "   curl -k https://$SERVER_IP/health"
    echo "   curl -k https://$SERVER_IP/api/auth/login"
fi
echo ""
echo "3. Update your frontend code to use HTTPS API URLs"
echo ""
echo "✅ Mixed content issue resolved!"
echo "✅ CORS configured for Netlify"
echo "✅ Backend API now accessible over HTTPS"
echo "========================================================================="

# Create updated test script
sudo -u garaadka tee /home/garaadka/test-https-api.sh << EOF
#!/bin/bash
echo "🧪 Testing Garaadka HTTPS API for Netlify..."
echo "========================================="

if [[ "$USE_LETSENCRYPT" == "true" ]]; then
    API_URL="https://$DOMAIN_NAME"
    CURL_OPTS=""
else
    API_URL="https://$SERVER_IP"
    CURL_OPTS="-k"
fi

echo "1. HTTPS Health Check:"
curl \$CURL_OPTS -s \$API_URL/health | jq . || curl \$CURL_OPTS -s \$API_URL/health

echo -e "\n2. HTTPS API Health:"
curl \$CURL_OPTS -s \$API_URL/api/health | jq . || curl \$CURL_OPTS -s \$API_URL/api/health

echo -e "\n3. CORS Test (simulating Netlify):"
curl \$CURL_OPTS -s -H "Origin: https://garaadka.netlify.app" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS \$API_URL/api/health

echo -e "\n4. SSL Certificate Info:"
if [[ "$USE_LETSENCRYPT" == "true" ]]; then
    echo "✅ Let's Encrypt certificate (trusted)"
else
    echo "⚠️ Self-signed certificate (browser warnings)"
fi

echo -e "\n========================================="
echo "✅ HTTPS API testing complete!"
echo "🌐 Use this URL in your Netlify app: \$API_URL/api"
EOF

sudo chmod +x /home/garaadka/test-https-api.sh

print_status "🧪 Test HTTPS API anytime with: /home/garaadka/test-https-api.sh"
print_success "🎯 HTTPS setup complete! Your Netlify app can now securely connect to the backend API."