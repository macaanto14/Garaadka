-- Simple Migration to add laundry-specific fields to register table
-- Run this if the conditional migration doesn't work

-- Add laundry-specific columns to register table
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `customer_name` varchar(255) DEFAULT NULL AFTER `name`,
ADD COLUMN IF NOT EXISTS `laundry_items` JSON DEFAULT NULL AFTER `phone`,
ADD COLUMN IF NOT EXISTS `drop_off_date` datetime DEFAULT NULL AFTER `laundry_items`,
ADD COLUMN IF NOT EXISTS `pickup_date` datetime DEFAULT NULL AFTER `drop_off_date`,
ADD COLUMN IF NOT EXISTS `delivery_status` enum('pending','ready','delivered','cancelled') DEFAULT 'pending' AFTER `pickup_date`,
ADD COLUMN IF NOT EXISTS `total_amount` decimal(10,2) DEFAULT 0.00 AFTER `delivery_status`,
ADD COLUMN IF NOT EXISTS `paid_amount` decimal(10,2) DEFAULT 0.00 AFTER `total_amount`,
ADD COLUMN IF NOT EXISTS `payment_status` enum('pending','partial','paid') DEFAULT 'pending' AFTER `paid_amount`,
ADD COLUMN IF NOT EXISTS `notes` text DEFAULT NULL AFTER `payment_status`,
ADD COLUMN IF NOT EXISTS `receipt_number` varchar(50) DEFAULT NULL AFTER `notes`;

-- Add indexes for better performance
ALTER TABLE `register`
ADD INDEX IF NOT EXISTS `idx_register_phone` (`phone`),
ADD INDEX IF NOT EXISTS `idx_register_delivery_status` (`delivery_status`),
ADD INDEX IF NOT EXISTS `idx_register_payment_status` (`payment_status`),
ADD INDEX IF NOT EXISTS `idx_register_drop_off_date` (`drop_off_date`),
ADD INDEX IF NOT EXISTS `idx_register_pickup_date` (`pickup_date`);

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