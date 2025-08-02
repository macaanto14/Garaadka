-- Fix for missing customer_type column in customers table
-- This script adds the missing customer_type column and other enhanced fields

USE gwldb;

-- Add missing columns to customers table
ALTER TABLE `customers` 
ADD COLUMN IF NOT EXISTS `city` varchar(100) DEFAULT NULL AFTER `address`,
ADD COLUMN IF NOT EXISTS `postal_code` varchar(20) DEFAULT NULL AFTER `city`,
ADD COLUMN IF NOT EXISTS `date_of_birth` date DEFAULT NULL AFTER `registration_date`,
ADD COLUMN IF NOT EXISTS `gender` enum('male','female','other') DEFAULT NULL AFTER `date_of_birth`,
ADD COLUMN IF NOT EXISTS `customer_type` enum('regular','vip','corporate') DEFAULT 'regular' AFTER `status`,
ADD COLUMN IF NOT EXISTS `discount_percentage` decimal(5,2) DEFAULT 0.00 AFTER `customer_type`,
ADD COLUMN IF NOT EXISTS `credit_limit` decimal(10,2) DEFAULT 0.00 AFTER `discount_percentage`,
ADD COLUMN IF NOT EXISTS `preferences` json DEFAULT NULL AFTER `notes`;

-- Add missing indexes
ALTER TABLE `customers` 
ADD INDEX IF NOT EXISTS `idx_customers_email` (`email`),
ADD INDEX IF NOT EXISTS `idx_customers_type` (`customer_type`);

-- Update existing customers to have 'regular' customer type if NULL
UPDATE `customers` SET `customer_type` = 'regular' WHERE `customer_type` IS NULL;

-- Now create or replace the views with the correct schema
CREATE OR REPLACE VIEW `order_summary` AS
SELECT 
    o.order_id,
    o.order_number,
    c.customer_name,
    c.phone_number,
    c.customer_type,
    o.order_date,
    o.due_date,
    o.delivery_date,
    o.total_amount,
    IFNULL(o.discount_amount, 0) AS discount_amount,
    IFNULL(o.tax_amount, 0) AS tax_amount,
    (o.total_amount - IFNULL(o.discount_amount, 0) + IFNULL(o.tax_amount, 0)) AS final_amount,
    o.paid_amount,
    (o.total_amount - IFNULL(o.discount_amount, 0) + IFNULL(o.tax_amount, 0) - o.paid_amount) AS balance_amount,
    o.status,
    o.payment_status,
    o.payment_method,
    IFNULL(o.priority, 'normal') AS priority,
    o.notes,
    COUNT(oi.item_id) AS total_items,
    SUM(CASE WHEN oi.status = 'completed' THEN 1 ELSE 0 END) AS completed_items,
    CASE 
        WHEN COUNT(oi.item_id) = SUM(CASE WHEN oi.status = 'completed' THEN 1 ELSE 0 END) 
        THEN 'All Complete'
        WHEN SUM(CASE WHEN oi.status = 'completed' THEN 1 ELSE 0 END) > 0 
        THEN 'Partially Complete'
        ELSE 'Not Started'
    END AS completion_status,
    o.created_at,
    o.updated_at
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id AND oi.deleted_at IS NULL
WHERE o.deleted_at IS NULL AND c.deleted_at IS NULL
GROUP BY o.order_id;

-- Create customer_summary view
CREATE OR REPLACE VIEW `customer_summary` AS
SELECT 
    c.customer_id,
    c.customer_name,
    c.phone_number,
    c.email,
    c.customer_type,
    c.registration_date,
    c.status,
    COUNT(DISTINCT o.order_id) AS total_orders,
    IFNULL(SUM(o.total_amount), 0) AS total_spent,
    IFNULL(SUM(o.paid_amount), 0) AS total_paid,
    IFNULL(SUM(o.total_amount - o.paid_amount), 0) AS total_balance,
    MAX(o.order_date) AS last_order_date,
    MIN(o.order_date) AS first_order_date,
    CASE 
        WHEN COUNT(DISTINCT o.order_id) > 0 
        THEN AVG(o.total_amount) 
        ELSE 0 
    END AS average_order_value,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders,
    c.created_at,
    c.updated_at
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.customer_id;

-- Create payment_summary view (compatible with existing schema)
CREATE OR REPLACE VIEW `payment_summary` AS
SELECT 
    p.payment_id,
    p.order_id,
    o.order_number,
    c.customer_name,
    c.phone_number,
    p.payment_date,
    p.amount,
    p.payment_method,
    IFNULL(p.payment_type, 'partial') AS payment_type,
    p.reference_number,
    IFNULL(p.status, 'completed') AS status,
    IFNULL(p.processed_by, p.created_by) AS processed_by,
    p.created_at
FROM payments p
LEFT JOIN orders o ON p.order_id = o.order_id
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE p.deleted_at IS NULL;

-- Create daily_sales_summary view
CREATE OR REPLACE VIEW `daily_sales_summary` AS
SELECT 
    DATE(o.order_date) AS sale_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(o.total_amount) AS total_revenue,
    SUM(o.paid_amount) AS total_collected,
    SUM(o.total_amount - o.paid_amount) AS total_outstanding,
    CASE 
        WHEN COUNT(DISTINCT o.order_id) > 0 
        THEN AVG(o.total_amount) 
        ELSE 0 
    END AS average_order_value,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders
FROM orders o
WHERE o.deleted_at IS NULL
GROUP BY DATE(o.order_date)
ORDER BY sale_date DESC;

-- Show success message
SELECT 'Database schema updated successfully! customer_type column added and views created.' AS status;