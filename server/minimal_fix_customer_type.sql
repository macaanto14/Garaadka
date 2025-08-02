-- Minimal fix - just add customer_type and create basic order_summary view
USE gwldb;

-- Add customer_type column
ALTER TABLE `customers` 
ADD COLUMN IF NOT EXISTS `customer_type` enum('regular','vip','corporate') DEFAULT 'regular';

-- Update existing customers
UPDATE `customers` SET `customer_type` = 'regular' WHERE `customer_type` IS NULL;

-- Create minimal order_summary view
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
    0 AS total_items,
    0 AS completed_items,
    'Not Started' AS completion_status,
    o.created_at,
    o.updated_at
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.deleted_at IS NULL AND c.deleted_at IS NULL;

SELECT 'Minimal fix completed!' AS status;