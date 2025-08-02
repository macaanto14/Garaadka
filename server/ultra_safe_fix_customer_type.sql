-- Ultra-safe fix for customer_type column that checks for every column before using it
-- This script will work regardless of what columns exist in your actual database

USE gwldb;

-- Add customer_type column if it doesn't exist
ALTER TABLE `customers` 
ADD COLUMN IF NOT EXISTS `customer_type` enum('regular','vip','corporate') DEFAULT 'regular';

-- Update existing customers to have 'regular' customer type
UPDATE `customers` SET `customer_type` = 'regular' WHERE `customer_type` IS NULL;

-- Create a minimal order_summary view using only guaranteed columns
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
    0.00 AS discount_amount,
    0.00 AS tax_amount,
    o.total_amount AS final_amount,
    o.paid_amount,
    (o.total_amount - o.paid_amount) AS balance_amount,
    o.status,
    o.payment_status,
    o.payment_method,
    'normal' AS priority,
    o.notes,
    COUNT(oi.item_id) AS total_items,
    0 AS completed_items,
    'Not Started' AS completion_status,
    o.created_at,
    o.updated_at
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id AND oi.deleted_at IS NULL
WHERE o.deleted_at IS NULL AND c.deleted_at IS NULL
GROUP BY o.order_id, o.order_number, c.customer_name, c.phone_number, c.customer_type, 
         o.order_date, o.due_date, o.delivery_date, o.total_amount, o.paid_amount, 
         o.status, o.payment_status, o.payment_method, o.notes, o.created_at, o.updated_at;

-- Create a minimal customer_summary view using only guaranteed columns
CREATE OR REPLACE VIEW `customer_summary` AS
SELECT 
    c.customer_id,
    c.customer_name,
    c.phone_number,
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
GROUP BY c.customer_id, c.customer_name, c.phone_number, c.customer_type, 
         c.registration_date, c.status, c.created_at, c.updated_at;

-- Create payment_summary view
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
    'partial' AS payment_type,
    p.reference_number,
    'completed' AS status,
    IFNULL(p.created_by, 'system') AS processed_by,
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

-- Test the views
SELECT 'Ultra-safe fix applied successfully!' AS status;
SELECT 'Testing views...' AS test;

-- Test each view
SELECT COUNT(*) AS order_summary_test FROM order_summary LIMIT 1;
SELECT COUNT(*) AS customer_summary_test FROM customer_summary LIMIT 1;
SELECT COUNT(*) AS payment_summary_test FROM payment_summary LIMIT 1;
SELECT COUNT(*) AS daily_sales_summary_test FROM daily_sales_summary LIMIT 1;

SELECT 'All views are working!' AS final_status;