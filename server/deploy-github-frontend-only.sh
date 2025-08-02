#!/bin/bash

# ========================================================================
# GARAADKA FRONTEND DEPLOYMENT FROM GITHUB
# ========================================================================
# This script deploys the actual frontend from GitHub repository
# and removes the basic dashboard, using your existing login page
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
FRONTEND_DIR="$APP_DIR/frontend"

print_status "🎨 Deploying Real Frontend from GitHub Repository"
echo "========================================================================="
echo "📦 Repository: $GITHUB_REPO"
echo "🎯 Target: Replace basic dashboard with actual frontend"
echo "========================================================================="

# Stop existing frontend PM2 process
print_status "⏹️ Stopping existing frontend process..."
sudo -u $APP_USER pm2 stop frontend 2>/dev/null || print_warning "Frontend process not running"
sudo -u $APP_USER pm2 delete frontend 2>/dev/null || print_warning "Frontend process not found"

# Backup existing frontend directory
print_status "💾 Backing up existing frontend..."
if [ -d "$FRONTEND_DIR" ]; then
    sudo mv $FRONTEND_DIR $FRONTEND_DIR.backup.$(date +%Y%m%d_%H%M%S)
fi

# Create fresh frontend directory
sudo mkdir -p $FRONTEND_DIR
sudo chown -R $APP_USER:$APP_USER $FRONTEND_DIR

# Clone/update repository
print_status "📥 Getting latest code from GitHub..."
cd $APP_DIR
if [ -d "Garaadka" ]; then
    print_status "Updating existing repository..."
    sudo -u $APP_USER git -C Garaadka pull
else
    print_status "Cloning repository..."
    sudo -u $APP_USER git clone $GITHUB_REPO
fi

# Analyze repository structure for frontend
print_status "🔍 Analyzing repository structure for frontend..."
cd $APP_DIR/Garaadka

# Look for frontend files in various locations
FRONTEND_FOUND=false
FRONTEND_SOURCE=""

# Check for dedicated frontend directories
for dir in "frontend" "client" "web" "ui" "www" "public"; do
    if [ -d "$dir" ]; then
        print_status "✅ Found frontend directory: $dir"
        FRONTEND_SOURCE="$dir"
        FRONTEND_FOUND=true
        break
    fi
done

# If no dedicated directory, check for frontend files in root
if [ "$FRONTEND_FOUND" = false ]; then
    # Look for common frontend files
    if [ -f "index.html" ] || [ -f "login.html" ] || [ -f "app.html" ]; then
        print_status "✅ Found frontend files in root directory"
        FRONTEND_SOURCE="."
        FRONTEND_FOUND=true
    elif [ -f "package.json" ]; then
        # Check if package.json indicates a frontend project
        if grep -q "react\|vue\|angular\|vite\|webpack\|parcel" package.json; then
            print_status "✅ Found frontend framework in package.json"
            FRONTEND_SOURCE="."
            FRONTEND_FOUND=true
        fi
    fi
fi

# If still not found, look for HTML files anywhere
if [ "$FRONTEND_FOUND" = false ]; then
    HTML_FILES=$(find . -name "*.html" -type f | head -5)
    if [ -n "$HTML_FILES" ]; then
        print_status "✅ Found HTML files in repository:"
        echo "$HTML_FILES"
        # Use the directory containing the first HTML file
        FIRST_HTML=$(echo "$HTML_FILES" | head -1)
        FRONTEND_SOURCE=$(dirname "$FIRST_HTML")
        FRONTEND_FOUND=true
    fi
fi

if [ "$FRONTEND_FOUND" = false ]; then
    print_error "❌ No frontend files found in repository!"
    print_error "Please ensure your repository contains:"
    print_error "- HTML files (index.html, login.html, etc.)"
    print_error "- A frontend/ or client/ directory"
    print_error "- Or a package.json with frontend dependencies"
    exit 1
fi

print_success "🎯 Using frontend source: $FRONTEND_SOURCE"

# Copy frontend files
print_status "📁 Copying frontend files..."
if [ "$FRONTEND_SOURCE" = "." ]; then
    # Copy all files except backend-specific ones
    sudo -u $APP_USER rsync -av \
        --exclude='node_modules' \
        --exclude='*.ts' \
        --exclude='routes' \
        --exclude='middleware' \
        --exclude='services' \
        --exclude='types' \
        --exclude='utils' \
        --exclude='*.sql' \
        --exclude='*.sh' \
        --exclude='*.md' \
        --exclude='Dockerfile*' \
        --exclude='docker*' \
        --exclude='kubernetes' \
        --exclude='.git' \
        --exclude='tsconfig.json' \
        ./ $FRONTEND_DIR/
else
    sudo -u $APP_USER cp -r $FRONTEND_SOURCE/* $FRONTEND_DIR/
fi

cd $FRONTEND_DIR

# Check if this is a Node.js frontend
if [ -f "package.json" ]; then
    print_status "📦 Installing frontend dependencies..."
    sudo -u $APP_USER npm install
    
    # Build if build script exists
    if grep -q '"build"' package.json; then
        print_status "🔨 Building frontend..."
        sudo -u $APP_USER npm run build
    fi
    
    # Check for start script
    if grep -q '"start"' package.json; then
        FRONTEND_START_CMD="npm start"
    elif grep -q '"serve"' package.json; then
        FRONTEND_START_CMD="npm run serve"
    else
        FRONTEND_START_CMD="node server.js"
    fi
else
    # Static HTML frontend - create a simple server
    print_status "🌐 Setting up static file server..."
    
    # Create package.json for static server
    sudo -u $APP_USER tee package.json << 'EOF'
{
  "name": "garaadka-frontend",
  "version": "1.0.0",
  "description": "Garaadka Frontend Static Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.6.0"
  }
}
EOF

    sudo -u $APP_USER npm install

    # Create server for static files
    sudo -u $APP_USER tee server.js << 'EOF'
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Serve static files
app.use(express.static('.'));
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

// Serve main page - try different possible entry points
app.get('/', (req, res) => {
  const possibleFiles = ['index.html', 'login.html', 'app.html', 'main.html'];
  
  for (const file of possibleFiles) {
    const filePath = path.join(__dirname, file);
    if (require('fs').existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  
  // If no specific file found, list available HTML files
  const fs = require('fs');
  const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
  
  if (htmlFiles.length > 0) {
    res.sendFile(path.join(__dirname, htmlFiles[0]));
  } else {
    res.send(`
      <h1>Garaadka Frontend</h1>
      <p>Frontend files deployed successfully!</p>
      <p>Available files: ${fs.readdirSync(__dirname).join(', ')}</p>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🎨 Frontend server running on port ${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
});
EOF

    FRONTEND_START_CMD="npm start"
fi

# Update PM2 ecosystem configuration
print_status "⚙️ Updating PM2 configuration..."
sudo -u $APP_USER tee $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'index.ts',
      cwd: '$APP_DIR/backend',
      interpreter: 'tsx',
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
      min_uptime: '10s'
    },
    {
      name: 'frontend',
      script: '${FRONTEND_START_CMD%% *}',
      args: '${FRONTEND_START_CMD#* }',
      cwd: '$FRONTEND_DIR',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        API_BASE_URL: 'http://localhost:5000'
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '256M',
      error_file: '/var/log/garaadka/frontend-error.log',
      out_file: '/var/log/garaadka/frontend-out.log',
      log_file: '/var/log/garaadka/frontend-combined.log',
      time: true,
      autorestart: true,
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: '5s'
    }
  ]
};
EOF

# Start frontend with PM2
print_status "🚀 Starting frontend with PM2..."
cd $APP_DIR
sudo -u $APP_USER pm2 start ecosystem.config.js --only frontend
sudo -u $APP_USER pm2 save

# Test frontend
print_status "🧪 Testing frontend deployment..."
sleep 5

# Check if frontend is running
if sudo -u $APP_USER pm2 list | grep -q "frontend.*online"; then
    print_success "✅ Frontend is running!"
else
    print_error "❌ Frontend failed to start"
    print_status "📋 PM2 status:"
    sudo -u $APP_USER pm2 list
    print_status "📋 Frontend logs:"
    sudo -u $APP_USER pm2 logs frontend --lines 10
    exit 1
fi

# Test HTTP response
if curl -s http://localhost:3000 >/dev/null; then
    print_success "✅ Frontend responding on port 3000"
else
    print_warning "⚠️ Frontend not responding on port 3000"
fi

# Show deployment summary
echo ""
echo "========================================================================="
print_success "🎉 FRONTEND DEPLOYMENT COMPLETE!"
echo "========================================================================="
echo "📁 Frontend Directory: $FRONTEND_DIR"
echo "🌐 Frontend URL: http://$(curl -s ifconfig.me):3000"
echo "🔗 Local URL: http://localhost:3000"
echo ""
echo "📋 Management Commands:"
echo "  pm2 list                    # View all processes"
echo "  pm2 logs frontend          # View frontend logs"
echo "  pm2 restart frontend       # Restart frontend"
echo "  pm2 stop frontend          # Stop frontend"
echo ""
echo "📁 Files deployed from: $FRONTEND_SOURCE"
echo "🎯 Your login page should now be accessible!"
echo "========================================================================="