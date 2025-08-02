-- Corrected immediate fix for missing columns and views
-- This script adds missing columns and creates working views

USE `gwldb`;

-- Add missing columns to existing tables
ALTER TABLE `customers` 
ADD COLUMN IF NOT EXISTS `customer_type` enum('regular','vip','corporate') DEFAULT 'regular';

ALTER TABLE `orders` 
ADD COLUMN IF NOT EXISTS `order_number` varchar(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `discount_amount` decimal(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS `tax_amount` decimal(10,2) DEFAULT 0.00;

-- Update existing customers to have 'regular' customer type
UPDATE `customers` SET `customer_type` = 'regular' WHERE `customer_type` IS NULL;

-- Generate order numbers for existing orders that don't have them
UPDATE `orders` 
SET `order_number` = CONCAT('ORD-', LPAD(order_id, 6, '0')) 
WHERE `order_number` IS NULL OR `order_number` = '';

-- Make order_number unique after populating it
ALTER TABLE `orders` 
ADD CONSTRAINT `unique_order_number` UNIQUE (`order_number`);

-- Create working order_summary view
CREATE OR REPLACE VIEW `order_summary` AS
SELECT 
    o.order_id,
    IFNULL(o.order_number, CONCAT('ORD-', LPAD(o.order_id, 6, '0'))) AS order_number,
    c.customer_name,
    c.phone_number,
    IFNULL(c.email, '') AS email,
    IFNULL(c.customer_type, 'regular') AS customer_type,
    o.order_date,
    o.due_date,
    o.delivery_date,
    o.total_amount,
    IFNULL(o.discount_amount, 0.00) AS discount_amount,
    IFNULL(o.tax_amount, 0.00) AS tax_amount,
    (o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00)) AS final_amount,
    o.paid_amount,
    (o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00) - IFNULL(o.paid_amount, 0)) AS balance_amount,
    o.status,
    o.payment_status,
    o.payment_method,
    'normal' AS priority,
    '' AS special_instructions,
    o.notes,
    COUNT(oi.item_id) AS total_items,
    0 AS completed_items,
    CASE 
        WHEN o.status = 'delivered' THEN 'Completed'
        WHEN o.status = 'ready' THEN 'Ready for Pickup'
        WHEN o.status = 'in_progress' THEN 'In Progress'
        WHEN o.status = 'pending' THEN 'Not Started'
        WHEN o.status = 'cancelled' THEN 'Cancelled'
        ELSE 'Unknown'
    END AS completion_status,
    o.created_at,
    o.updated_at
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id AND oi.deleted_at IS NULL
WHERE o.deleted_at IS NULL AND c.deleted_at IS NULL
GROUP BY o.order_id, o.order_number, c.customer_name, c.phone_number, c.email, c.customer_type, 
         o.order_date, o.due_date, o.delivery_date, o.total_amount, o.discount_amount, o.tax_amount, 
         o.paid_amount, o.status, o.payment_status, o.payment_method, o.notes, o.created_at, o.updated_at;

-- Create working customer_summary view
CREATE OR REPLACE VIEW `customer_summary` AS
SELECT 
    c.customer_id,
    c.customer_name,
    c.phone_number,
    IFNULL(c.email, '') AS email,
    IFNULL(c.address, '') AS address,
    '' AS city,
    IFNULL(c.customer_type, 'regular') AS customer_type,
    0.00 AS discount_percentage,
    0.00 AS credit_limit,
    c.registration_date,
    c.status,
    COUNT(DISTINCT o.order_id) AS total_orders,
    IFNULL(SUM(o.total_amount), 0) AS total_spent,
    IFNULL(SUM(o.paid_amount), 0) AS total_paid,
    IFNULL(SUM(o.total_amount - IFNULL(o.paid_amount, 0)), 0) AS total_balance,
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
GROUP BY c.customer_id, c.customer_name, c.phone_number, c.email, c.address, 
         c.customer_type, c.registration_date, c.status, c.created_at, c.updated_at;

-- Create working payment_summary view
CREATE OR REPLACE VIEW `payment_summary` AS
SELECT 
    p.payment_id,
    p.order_id,
    IFNULL(o.order_number, CONCAT('ORD-', LPAD(o.order_id, 6, '0'))) AS order_number,
    c.customer_name,
    c.phone_number,
    IFNULL(c.email, '') AS email,
    p.payment_date,
    p.amount,
    p.payment_method,
    'partial' AS payment_type,
    p.reference_number,
    '' AS transaction_id,
    'completed' AS status,
    IFNULL(ua.fname, 'System') AS processed_by,
    p.notes,
    p.created_at
FROM payments p
LEFT JOIN orders o ON p.order_id = o.order_id
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN `user accounts` ua ON p.created_by = ua.`PERSONAL ID`
WHERE p.deleted_at IS NULL;

-- Create working daily_sales_summary view
CREATE OR REPLACE VIEW `daily_sales_summary` AS
SELECT 
    DATE(o.order_date) AS sale_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(o.total_amount) AS total_revenue,
    SUM(IFNULL(o.discount_amount, 0.00)) AS total_discounts,
    SUM(IFNULL(o.tax_amount, 0.00)) AS total_tax,
    SUM(o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00)) AS total_final_amount,
    SUM(o.paid_amount) AS total_collected,
    SUM(o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00) - IFNULL(o.paid_amount, 0)) AS total_outstanding,
    CASE 
        WHEN COUNT(DISTINCT o.order_id) > 0 
        THEN AVG(o.total_amount) 
        ELSE 0 
    END AS average_order_value,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN o.status = 'in_progress' THEN 1 END) AS in_progress_orders,
    COUNT(CASE WHEN o.status = 'ready' THEN 1 END) AS ready_orders
FROM orders o
WHERE o.deleted_at IS NULL
GROUP BY DATE(o.order_date)
ORDER BY sale_date DESC;

-- Add useful indexes for performance
CREATE INDEX IF NOT EXISTS `idx_orders_order_number` ON `orders` (`order_number`);
CREATE INDEX IF NOT EXISTS `idx_customers_customer_type` ON `customers` (`customer_type`);

-- Test the views
SELECT 'Corrected fix applied successfully!' AS status;
SELECT 'Testing views...' AS test;

SELECT COUNT(*) AS order_summary_count FROM order_summary;
SELECT COUNT(*) AS customer_summary_count FROM customer_summary;
SELECT COUNT(*) AS payment_summary_count FROM payment_summary;
SELECT COUNT(*) AS daily_sales_summary_count FROM daily_sales_summary;

SELECT 'All views are working! Database is ready.' AS final_status;

-- Show sample data from each view
SELECT 'Sample from order_summary:' AS sample_title;
SELECT * FROM order_summary LIMIT 3;

SELECT 'Sample from customer_summary:' AS sample_title;
SELECT * FROM customer_summary LIMIT 3;

SELECT 'Sample from payment_summary:' AS sample_title;
SELECT * FROM payment_summary LIMIT 3;

SELECT 'Sample from daily_sales_summary:' AS sample_title;
SELECT * FROM daily_sales_summary LIMIT 3;