#!/bin/bash

# Final Fix for Customer Type Column - Works with actual database schema
# This script adds the missing customer_type column and creates compatible views

set -e

echo "🔧 Applying final fix for customer_type column..."

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

# Apply the final fix
echo "🚀 Applying final customer_type fix..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < final_fix_customer_type.sql

if [ $? -eq 0 ]; then
    echo "✅ Final fix applied successfully!"
    
    # Verify the fix
    echo "🔍 Verifying the fix..."
    
    # Test the order_summary view
    echo "🧪 Testing order_summary view..."
    RESULT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM order_summary;" 2>/dev/null | tail -n 1)
    
    if [ $? -eq 0 ]; then
        echo "✅ order_summary view is working correctly (found $RESULT records)"
    else
        echo "❌ order_summary view has issues"
        exit 1
    fi
    
    # Check if customer_type column exists
    COLUMN_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW COLUMNS FROM customers LIKE 'customer_type';" | wc -l)
    
    if [ $COLUMN_EXISTS -gt 1 ]; then
        echo "✅ customer_type column exists"
    else
        echo "❌ customer_type column not found"
        exit 1
    fi
    
    echo ""
    echo "🎉 Final fix completed successfully!"
    echo ""
    echo "📋 What was fixed:"
    echo "   - Added customer_type column to customers table"
    echo "   - Created order_summary view compatible with your database schema"
    echo "   - Created customer_summary, payment_summary, and daily_sales_summary views"
    echo "   - All views work with your current table structure"
    echo ""
    echo "🔄 You can now restart your Node.js application"
    
else
    echo "❌ Final fix failed!"
    exit 1
fi