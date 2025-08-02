-- Quick fix for the customer_type column issue
-- This is a minimal fix that just adds the customer_type column and creates a basic view

USE gwldb;

-- Add customer_type column if it doesn't exist
ALTER TABLE `customers` 
ADD COLUMN IF NOT EXISTS `customer_type` enum('regular','vip','corporate') DEFAULT 'regular';

-- Update existing customers to have 'regular' customer type
UPDATE `customers` SET `customer_type` = 'regular' WHERE `customer_type` IS NULL;

-- Create a simple order_summary view that works with your current schema
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
    0 AS discount_amount,
    0 AS tax_amount,
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
LEFT JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.deleted_at IS NULL AND c.deleted_at IS NULL
GROUP BY o.order_id;

SELECT 'Quick fix applied successfully!' AS status;