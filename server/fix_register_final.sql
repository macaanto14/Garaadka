-- Final fix for register table
-- First run the diagnostic to see current structure

-- Check current table structure
DESCRIBE `register`;

-- Show what columns exist
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'register'
ORDER BY ORDINAL_POSITION;

-- If the above shows there's no 'id' column, but there's another AUTO_INCREMENT column,
-- we need to handle it differently. 

-- The safest approach: Recreate the table with correct structure
-- (This will preserve data if you uncomment the backup/restore lines)

-- Step 1: Backup existing data (uncomment if you have data to preserve)
-- CREATE TABLE register_backup AS SELECT * FROM register;

-- Step 2: Drop and recreate table
DROP TABLE IF EXISTS `register`;

CREATE TABLE `register` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `laundry_items` JSON DEFAULT NULL,
  `drop_off_date` datetime DEFAULT NULL,
  `pickup_date` datetime DEFAULT NULL,
  `delivery_status` enum('pending','ready','delivered','cancelled') DEFAULT 'pending',
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `payment_status` enum('pending','partial','paid') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `role` enum('admin','user','manager') DEFAULT 'user',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_register_phone` (`phone`),
  KEY `idx_register_delivery_status` (`delivery_status`),
  KEY `idx_register_payment_status` (`payment_status`),
  KEY `idx_register_drop_off_date` (`drop_off_date`),
  KEY `idx_register_pickup_date` (`pickup_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Restore data (uncomment if you backed up data)
-- INSERT INTO register SELECT * FROM register_backup;
-- DROP TABLE register_backup;

-- Show final structure
DESCRIBE `register`;