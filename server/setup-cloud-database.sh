#!/bin/bash

# ========================================================================
# CLOUD DATABASE SETUP SCRIPT
# Sets up the database schema on your cloud database
# ========================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

print_status "🗄️  Setting up cloud database at $DB_HOST..."

# Test connection
print_status "Testing database connection..."
if ! mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "SELECT 1;" 2>/dev/null; then
    print_error "Cannot connect to database at $DB_HOST"
    exit 1
fi

print_success "✅ Database connection successful!"

# Create database if it doesn't exist
print_status "Ensuring database '$DB_NAME' exists..."
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

# Apply database schema
if [ -f "safe_complete_database_migration.sql" ]; then
    print_status "Applying safe database migration..."
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME < safe_complete_database_migration.sql
elif [ -f "production_migration_fixed.sql" ]; then
    print_status "Applying production migration..."
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME < production_migration_fixed.sql
else
    print_status "Creating basic database schema..."
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME << 'EOF'
-- Basic Garaadka schema
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    customer_type ENUM('regular', 'vip', 'wholesale') DEFAULT 'regular',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NULL,
    delivery_date TIMESTAMP NULL,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE IF NOT EXISTS order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    service_name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- Insert sample data
INSERT IGNORE INTO customers (customer_name, phone_number, email, customer_type) VALUES
('John Doe', '+1234567890', 'john@example.com', 'regular'),
('Jane Smith', '+1234567891', 'jane@example.com', 'vip'),
('Bob Johnson', '+1234567892', 'bob@example.com', 'regular');
EOF
fi

# Apply triggers if available
if [ -f "complete_triggers.sql" ]; then
    print_status "Applying database triggers..."
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME < complete_triggers.sql
fi

# Test the setup
print_status "Testing database setup..."
TABLE_COUNT=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" 2>/dev/null)
CUSTOMER_COUNT=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME -se "SELECT COUNT(*) FROM customers;" 2>/dev/null)

print_success "✅ Database setup completed!"
echo "📊 Database Statistics:"
echo "  - Tables: $TABLE_COUNT"
echo "  - Customers: $CUSTOMER_COUNT"