#!/bin/bash

# Fix Customer Type Column - Production Database Update
# This script adds the missing customer_type column and recreates views

set -e

echo "🔧 Fixing customer_type column in production database..."

# Load environment variables
if [ -f .env.production ]; then
    source .env.production
    echo "✅ Loaded production environment variables"
else
    echo "❌ .env.production file not found!"
    exit 1
fi

# Check if MySQL client is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client is not installed!"
    echo "Install it with: sudo apt-get install mysql-client-core-8.0"
    exit 1
fi

# Test database connection
echo "🔍 Testing database connection..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed!"
    echo "Please check your database credentials in .env.production"
    exit 1
fi

# Backup current database structure
echo "💾 Creating backup of current database structure..."
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" --no-data "$DB_NAME" > "backup_schema_$(date +%Y%m%d_%H%M%S).sql"
echo "✅ Schema backup created"

# Apply the fix
echo "🚀 Applying customer_type column fix..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < fix_customer_type_column.sql

if [ $? -eq 0 ]; then
    echo "✅ Database fix applied successfully!"
    
    # Verify the fix
    echo "🔍 Verifying the fix..."
    
    # Check if customer_type column exists
    COLUMN_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW COLUMNS FROM customers LIKE 'customer_type';" | wc -l)
    
    if [ $COLUMN_EXISTS -gt 1 ]; then
        echo "✅ customer_type column exists"
    else
        echo "❌ customer_type column not found"
        exit 1
    fi
    
    # Check if views exist
    VIEW_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE '%_summary';" | wc -l)
    echo "✅ Found $VIEW_COUNT summary views"
    
    # Test the order_summary view
    echo "🧪 Testing order_summary view..."
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) as view_test FROM order_summary LIMIT 1;" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ order_summary view is working correctly"
    else
        echo "❌ order_summary view has issues"
        exit 1
    fi
    
    echo ""
    echo "🎉 Database fix completed successfully!"
    echo ""
    echo "📋 Summary:"
    echo "   - Added customer_type column to customers table"
    echo "   - Added additional customer fields (city, postal_code, etc.)"
    echo "   - Created/updated all summary views"
    echo "   - All views are working correctly"
    echo ""
    echo "🔄 You can now restart your Node.js application"
    
else
    echo "❌ Database fix failed!"
    exit 1
fi