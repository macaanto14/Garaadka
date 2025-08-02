#!/bin/bash

# ========================================================================
# GARAADKA LAUNDRY MANAGEMENT SYSTEM - COMPLETE DATABASE DEPLOYMENT
# ========================================================================
# This script deploys the complete working database
# Version: 2.0.0
# ========================================================================

set -e  # Exit on any error

echo "========================================================================="
echo "GARAADKA LAUNDRY MANAGEMENT SYSTEM - COMPLETE DATABASE DEPLOYMENT"
echo "========================================================================="

# Load environment variables
if [ -f .env.production ]; then
    echo "Loading production environment variables..."
    export $(cat .env.production | grep -v '^#' | xargs)
elif [ -f .env ]; then
    echo "Loading development environment variables..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: No environment file found (.env or .env.production)"
    exit 1
fi

# Set default values if not provided
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_NAME=${DB_NAME:-gwldb}

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Check if MySQL client is installed
if ! command -v mysql &> /dev/null; then
    echo "Error: MySQL client is not installed"
    echo "Please install MySQL client first"
    exit 1
fi

# Test database connection
echo "Testing database connection..."
if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null; then
    echo "Error: Cannot connect to database"
    echo "Please check your database credentials and ensure MySQL server is running"
    exit 1
fi
echo "✓ Database connection successful"

# Create backup of existing database (if exists)
echo ""
echo "Creating backup of existing database..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" &> /dev/null; then
    echo "Backing up existing database to $BACKUP_FILE..."
    mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"
    echo "✓ Backup created: $BACKUP_FILE"
else
    echo "No existing database found, proceeding with fresh installation..."
fi

# Deploy the complete database
echo ""
echo "Deploying complete database schema..."
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" < complete_working_database.sql; then
    echo "✓ Database schema deployed successfully"
else
    echo "Error: Failed to deploy database schema"
    exit 1
fi

# Verify deployment
echo ""
echo "Verifying deployment..."

# Check tables
TABLE_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N)
echo "✓ Tables created: $TABLE_COUNT"

# Check views
VIEW_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = '$DB_NAME';" -s -N)
echo "✓ Views created: $VIEW_COUNT"

# Check triggers
TRIGGER_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = '$DB_NAME';" -s -N)
echo "✓ Triggers created: $TRIGGER_COUNT"

# Check admin user
ADMIN_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM user_accounts WHERE username = 'admin';" -s -N)
if [ "$ADMIN_EXISTS" -eq 1 ]; then
    echo "✓ Admin user created successfully"
else
    echo "⚠ Warning: Admin user not found"
fi

# Check services
SERVICE_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM services;" -s -N)
echo "✓ Default services: $SERVICE_COUNT"

# Check customers
CUSTOMER_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM customers;" -s -N)
echo "✓ Sample customers: $CUSTOMER_COUNT"

# Test views
echo ""
echo "Testing views..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 'order_summary' as view_name, COUNT(*) as record_count FROM order_summary UNION ALL SELECT 'customer_summary', COUNT(*) FROM customer_summary UNION ALL SELECT 'payment_summary', COUNT(*) FROM payment_summary UNION ALL SELECT 'daily_sales_summary', COUNT(*) FROM daily_sales_summary UNION ALL SELECT 'service_performance', COUNT(*) FROM service_performance;"

echo ""
echo "========================================================================="
echo "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "========================================================================="
echo ""
echo "Database Features:"
echo "  ✓ Complete schema with all necessary columns"
echo "  ✓ Enhanced customers table with customer_type, email, etc."
echo "  ✓ Enhanced orders table with discount_amount, tax_amount, priority"
echo "  ✓ Services management"
echo "  ✓ Comprehensive views for reporting"
echo "  ✓ Automatic calculations via triggers"
echo "  ✓ Performance optimized indexes"
echo "  ✓ Audit trail support"
echo "  ✓ Default admin user (username: admin, password: admin123)"
echo "  ✓ Sample data for testing"
echo ""
echo "Next Steps:"
echo "  1. Change the default admin password"
echo "  2. Configure your application to use the new database"
echo "  3. Test all functionality"
echo "  4. Import any existing data if needed"
echo ""
echo "Default Admin Credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo "  ⚠ IMPORTANT: Change this password immediately!"
echo ""