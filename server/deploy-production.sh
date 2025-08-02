#!/bin/bash

# ========================================================================
# GARAADKA LAUNDRY MANAGEMENT SYSTEM - PRODUCTION DEPLOYMENT SCRIPT
# ========================================================================
# This script automates the production deployment process
# Run this script on your production server
# ========================================================================

set -e  # Exit on any error

echo "🚀 Starting Garaadka Laundry Management System Production Deployment..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Check if MySQL/MariaDB client is available
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client is not installed. Please install MySQL client."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p backups
mkdir -p ssl

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Install additional required packages
echo "📦 Installing jsonwebtoken..."
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production file not found. Please create it from .env.production template"
    echo "   and update it with your production values."
    exit 1
fi

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Test database connection
echo "🔍 Testing database connection..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed. Please check your database credentials."
    exit 1
fi

# Ask for confirmation before running migration
echo "⚠️  About to run database migration. This will create/update database tables."
read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled by user"
    exit 1
fi

# Run database migration
echo "🗄️  Running database migration..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < production_migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully"
else
    echo "❌ Database migration failed"
    exit 1
fi

# Set proper file permissions
echo "🔒 Setting file permissions..."
chmod 600 .env.production
chmod +x deploy-production.sh

# Create systemd service file (optional)
if command -v systemctl &> /dev/null; then
    echo "🔧 Creating systemd service..."
    sudo tee /etc/systemd/system/garaadka.service > /dev/null <<EOF
[Unit]
Description=Garaadka Laundry Management System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable garaadka
    echo "✅ Systemd service created and enabled"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the application: npm start (or sudo systemctl start garaadka)"
echo "2. Test the API endpoints"
echo "3. Login with admin/admin123 and CHANGE THE PASSWORD"
echo "4. Update business information in app settings"
echo "5. Configure SSL certificates if using HTTPS"
echo ""
echo "📊 Application will be available at:"
echo "   HTTP:  http://localhost:$PORT"
echo "   HTTPS: https://localhost:$HTTPS_PORT (if SSL configured)"
echo ""
echo "🔐 Default admin credentials (CHANGE IMMEDIATELY):"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📚 Documentation:"
echo "   - API Testing Guide: API_TESTING_GUIDE.md"
echo "   - Deployment Checklist: PRODUCTION_DEPLOYMENT_CHECKLIST.md"
echo "   - Postman Collection: Garaadka-Complete-API-Testing.postman_collection.json"