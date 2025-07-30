-- Fix register table structure
-- This script will ensure the register table has the correct structure

-- First, let's check if the table exists and what columns it has
-- If the table doesn't have an 'id' column, we'll add it

-- Check current table structure
DESCRIBE `register`;

-- Add id column if it doesn't exist (this will be the primary key)
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `id` int(11) NOT NULL AUTO_INCREMENT FIRST,
ADD PRIMARY KEY IF NOT EXISTS (`id`);

-- Ensure all required columns exist
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `name` varchar(255) NOT NULL AFTER `id`,
ADD COLUMN IF NOT EXISTS `username` varchar(100) NOT NULL AFTER `name`,
ADD COLUMN IF NOT EXISTS `password` varchar(255) NOT NULL AFTER `username`,
ADD COLUMN IF NOT EXISTS `email` varchar(255) DEFAULT NULL AFTER `password`,
ADD COLUMN IF NOT EXISTS `phone` varchar(20) DEFAULT NULL AFTER `email`,
ADD COLUMN IF NOT EXISTS `role` enum('admin','user','manager') DEFAULT 'user' AFTER `phone`,
ADD COLUMN IF NOT EXISTS `status` enum('active','inactive') DEFAULT 'active' AFTER `role`,
ADD COLUMN IF NOT EXISTS `created_at` timestamp DEFAULT current_timestamp() AFTER `status`,
ADD COLUMN IF NOT EXISTS `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER `created_at`,
ADD COLUMN IF NOT EXISTS `deleted_at` timestamp NULL DEFAULT NULL AFTER `updated_at`,
ADD COLUMN IF NOT EXISTS `created_by` varchar(100) DEFAULT NULL AFTER `deleted_at`,
ADD COLUMN IF NOT EXISTS `updated_by` varchar(100) DEFAULT NULL AFTER `created_by`,
ADD COLUMN IF NOT EXISTS `deleted_by` varchar(100) DEFAULT NULL AFTER `updated_by`;

-- Add laundry-specific columns
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

-- Add unique constraint on username if it doesn't exist
ALTER TABLE `register` 
ADD UNIQUE KEY IF NOT EXISTS `username` (`username`);

-- Add indexes for better performance
ALTER TABLE `register`
ADD INDEX IF NOT EXISTS `idx_register_created_at` (`created_at`),
ADD INDEX IF NOT EXISTS `idx_register_updated_at` (`updated_at`),
ADD INDEX IF NOT EXISTS `idx_register_deleted_at` (`deleted_at`),
ADD INDEX IF NOT EXISTS `idx_register_phone` (`phone`),
ADD INDEX IF NOT EXISTS `idx_register_delivery_status` (`delivery_status`),
ADD INDEX IF NOT EXISTS `idx_register_payment_status` (`payment_status`),
ADD INDEX IF NOT EXISTS `idx_register_drop_off_date` (`drop_off_date`),
ADD INDEX IF NOT EXISTS `idx_register_pickup_date` (`pickup_date`);

-- Show final table structure
DESCRIBE `register`;