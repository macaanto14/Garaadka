-- Migration to add laundry-specific fields to register table
-- This extends the existing register table for laundry management

-- Add laundry-specific columns to register table
ALTER TABLE `register` 
ADD COLUMN `customer_name` varchar(255) DEFAULT NULL AFTER `name`,
ADD COLUMN `laundry_items` JSON DEFAULT NULL AFTER `phone`,
ADD COLUMN `drop_off_date` datetime DEFAULT NULL AFTER `laundry_items`,
ADD COLUMN `pickup_date` datetime DEFAULT NULL AFTER `drop_off_date`,
ADD COLUMN `delivery_status` enum('pending','ready','delivered','cancelled') DEFAULT 'pending' AFTER `pickup_date`,
ADD COLUMN `total_amount` decimal(10,2) DEFAULT 0.00 AFTER `delivery_status`,
ADD COLUMN `paid_amount` decimal(10,2) DEFAULT 0.00 AFTER `total_amount`,
ADD COLUMN `payment_status` enum('pending','partial','paid') DEFAULT 'pending' AFTER `paid_amount`,
ADD COLUMN `notes` text DEFAULT NULL AFTER `payment_status`,
ADD COLUMN `receipt_number` varchar(50) DEFAULT NULL AFTER `notes`;

-- Add indexes for better performance
ALTER TABLE `register`
ADD INDEX `idx_register_phone` (`phone`),
ADD INDEX `idx_register_delivery_status` (`delivery_status`),
ADD INDEX `idx_register_payment_status` (`payment_status`),
ADD INDEX `idx_register_drop_off_date` (`drop_off_date`),
ADD INDEX `idx_register_pickup_date` (`pickup_date`);

-- Create a view for easier laundry register access
CREATE OR REPLACE VIEW `laundry_register_view` AS
SELECT 
    r.id,
    r.name,
    r.customer_name,
    r.phone,
    r.email,
    r.laundry_items,
    r.drop_off_date,
    r.pickup_date,
    r.delivery_status,
    r.total_amount,
    r.paid_amount,
    (r.total_amount - IFNULL(r.paid_amount, 0)) AS balance,
    r.payment_status,
    r.notes,
    r.receipt_number,
    r.status,
    r.created_at,
    r.updated_at,
    r.created_by,
    r.updated_by
FROM register r
WHERE r.deleted_at IS NULL
ORDER BY r.created_at DESC;