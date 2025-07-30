-- Corrected fix for register table structure
-- This handles the case where there's already an AUTO_INCREMENT column

-- First, let's see what we're working with
DESCRIBE `register`;

-- Check if there's already an AUTO_INCREMENT column
SELECT 
    COLUMN_NAME, 
    COLUMN_KEY, 
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'register'
AND EXTRA LIKE '%auto_increment%';

-- Option 1: If the table has a different primary key name, rename it to 'id'
-- (Uncomment the lines below if the primary key has a different name)
-- ALTER TABLE `register` CHANGE `existing_pk_column_name` `id` int(11) NOT NULL AUTO_INCREMENT;

-- Option 2: If there's no 'id' column but there's another AUTO_INCREMENT column,
-- we need to remove the AUTO_INCREMENT from that column first, then add our 'id' column

-- Step 1: Find and modify existing AUTO_INCREMENT column (if it's not named 'id')
-- This is a template - you'll need to replace 'existing_auto_column' with the actual column name
-- ALTER TABLE `register` MODIFY `existing_auto_column` int(11) NOT NULL;
-- ALTER TABLE `register` DROP PRIMARY KEY;

-- Step 2: Add the 'id' column as the new primary key
-- ALTER TABLE `register` ADD COLUMN `id` int(11) NOT NULL AUTO_INCREMENT FIRST;
-- ALTER TABLE `register` ADD PRIMARY KEY (`id`);

-- Option 3: If the table structure is completely wrong, recreate it
-- (Use this as a last resort if you don't have important data)

-- Backup existing data (if any)
-- CREATE TABLE register_backup AS SELECT * FROM register;

-- Drop and recreate the table with correct structure
-- DROP TABLE IF EXISTS `register`;

-- CREATE TABLE `register` (
--   `id` int(11) NOT NULL AUTO_INCREMENT,
--   `name` varchar(255) NOT NULL,
--   `customer_name` varchar(255) DEFAULT NULL,
--   `username` varchar(100) NOT NULL,
--   `password` varchar(255) NOT NULL,
--   `email` varchar(255) DEFAULT NULL,
--   `phone` varchar(20) DEFAULT NULL,
--   `laundry_items` JSON DEFAULT NULL,
--   `drop_off_date` datetime DEFAULT NULL,
--   `pickup_date` datetime DEFAULT NULL,
--   `delivery_status` enum('pending','ready','delivered','cancelled') DEFAULT 'pending',
--   `total_amount` decimal(10,2) DEFAULT 0.00,
--   `paid_amount` decimal(10,2) DEFAULT 0.00,
--   `payment_status` enum('pending','partial','paid') DEFAULT 'pending',
--   `notes` text DEFAULT NULL,
--   `receipt_number` varchar(50) DEFAULT NULL,
--   `role` enum('admin','user','manager') DEFAULT 'user',
--   `status` enum('active','inactive') DEFAULT 'active',
--   `created_at` timestamp DEFAULT current_timestamp(),
--   `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
--   `deleted_at` timestamp NULL DEFAULT NULL,
--   `created_by` varchar(100) DEFAULT NULL,
--   `updated_by` varchar(100) DEFAULT NULL,
--   `deleted_by` varchar(100) DEFAULT NULL,
--   PRIMARY KEY (`id`),
--   UNIQUE KEY `username` (`username`),
--   KEY `idx_register_created_at` (`created_at`),
--   KEY `idx_register_updated_at` (`updated_at`),
--   KEY `idx_register_deleted_at` (`deleted_at`),
--   KEY `idx_register_phone` (`phone`),
--   KEY `idx_register_delivery_status` (`delivery_status`),
--   KEY `idx_register_payment_status` (`payment_status`),
--   KEY `idx_register_drop_off_date` (`drop_off_date`),
--   KEY `idx_register_pickup_date` (`pickup_date`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Restore data if you backed it up
-- INSERT INTO register SELECT * FROM register_backup;
-- DROP TABLE register_backup;

-- Add missing columns if they don't exist (safe approach)
SET @sql = '';
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'register' AND COLUMN_NAME = 'customer_name';

IF @col_exists = 0 THEN
    ALTER TABLE `register` ADD COLUMN `customer_name` varchar(255) DEFAULT NULL;
END IF;

-- Add other missing columns with similar checks
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'register' AND COLUMN_NAME = 'laundry_items';

IF @col_exists = 0 THEN
    ALTER TABLE `register` ADD COLUMN `laundry_items` JSON DEFAULT NULL;
END IF;

-- Continue for other columns...

-- Show final structure
DESCRIBE `register`;