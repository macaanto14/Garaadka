-- Simple fix for register table - add missing columns safely
-- This uses a different approach that works in regular SQL

-- Add missing columns one by one with error handling
-- The IF NOT EXISTS clause will prevent errors if columns already exist

-- Add customer_name column
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `customer_name` varchar(255) DEFAULT NULL;

-- Add laundry_items column  
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `laundry_items` JSON DEFAULT NULL;

-- Add drop_off_date column
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `drop_off_date` datetime DEFAULT NULL;

-- Add pickup_date column
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `pickup_date` datetime DEFAULT NULL;

-- Add delivery_status column
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `delivery_status` enum('pending','ready','delivered','cancelled') DEFAULT 'pending';

-- Add total_amount column
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `total_amount` decimal(10,2) DEFAULT 0.00;

-- Add paid_amount column
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `paid_amount` decimal(10,2) DEFAULT 0.00;

-- Add payment_status column
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `payment_status` enum('pending','partial','paid') DEFAULT 'pending';

-- Add notes column
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `notes` text DEFAULT NULL;

-- Add receipt_number column
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `receipt_number` varchar(50) DEFAULT NULL;

-- Add indexes if they don't exist
ALTER TABLE `register`
ADD INDEX IF NOT EXISTS `idx_register_phone` (`phone`),
ADD INDEX IF NOT EXISTS `idx_register_delivery_status` (`delivery_status`),
ADD INDEX IF NOT EXISTS `idx_register_payment_status` (`payment_status`),
ADD INDEX IF NOT EXISTS `idx_register_drop_off_date` (`drop_off_date`),
ADD INDEX IF NOT EXISTS `idx_register_pickup_date` (`pickup_date`);

-- Show final table structure
DESCRIBE `register`;