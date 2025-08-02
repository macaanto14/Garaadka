#!/bin/bash

# ========================================================================
# GARAADKA PRODUCTION DATABASE DEPLOYMENT SCRIPT
# ========================================================================

set -e

echo "🗄️  Starting Garaadka Production Database Deployment..."

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

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    print_status "Environment variables loaded"
else
    print_error ".env.production file not found!"
    exit 1
fi

# Check if MySQL/MariaDB is installed
if ! command -v mysql &> /dev/null; then
    print_error "MySQL client is not installed. Installing..."
    sudo apt update
    sudo apt install -y mysql-client-core-8.0
fi

# Test database connection
print_status "Testing database connection..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "✅ Database connection successful"
else
    print_error "❌ Database connection failed. Please check your credentials."
    exit 1
fi

# Backup existing database (if exists)
print_status "Creating backup of existing database..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" --single-transaction --routines --triggers "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || true
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    print_status "✅ Backup created: $BACKUP_FILE"
else
    print_warning "No existing database to backup or backup failed"
    rm -f "$BACKUP_FILE"
fi

# Deploy production database
print_status "Deploying production database schema..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" < production_database_complete.sql

if [ $? -eq 0 ]; then
    print_status "✅ Production database deployed successfully!"
else
    print_error "❌ Database deployment failed!"
    exit 1
fi

# Verify deployment
print_status "Verifying database deployment..."
TABLES_COUNT=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N)
VIEWS_COUNT=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = '$DB_NAME';" -s -N)
TRIGGERS_COUNT=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = '$DB_NAME';" -s -N)

print_status "📊 Database Statistics:"
echo "   - Tables: $TABLES_COUNT"
echo "   - Views: $VIEWS_COUNT"
echo "   - Triggers: $TRIGGERS_COUNT"

# Test admin login
print_status "Testing admin user login..."
ADMIN_EXISTS=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SELECT COUNT(*) FROM \`user accounts\` WHERE USERNAME = 'admin';" -s -N)
if [ "$ADMIN_EXISTS" -eq 1 ]; then
    print_status "✅ Admin user created successfully"
else
    print_error "❌ Admin user creation failed"
fi

# Set proper permissions on backup file
if [ -f "$BACKUP_FILE" ]; then
    chmod 600 "$BACKUP_FILE"
    print_status "Backup file permissions set to 600"
fi

echo ""
print_status "🎉 Production database deployment completed!"
echo ""
print_status "📋 Next steps:"
echo "1. Start your Node.js application"
echo "2. Test API endpoints"
echo "3. Login with admin/admin123 and CHANGE THE PASSWORD"
echo "4. Configure business settings in app_settings"
echo ""
print_status "🔐 Default admin credentials (CHANGE IMMEDIATELY):"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
print_status "📚 Database includes:"
echo "   - Complete schema with all tables"
echo "   - Audit trail system"
echo "   - Automated triggers for calculations"
echo "   - Performance-optimized indexes"
echo "   - Business reporting views"
echo "   - Default services and settings"