-- Fixed Migration to add laundry-specific fields to register table
-- This extends the existing register table for laundry management

-- First, let's check if columns already exist and add them if they don't
-- Add laundry-specific columns to register table

-- Add customer_name column after name
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND COLUMN_NAME = 'customer_name') = 0,
    'ALTER TABLE `register` ADD COLUMN `customer_name` varchar(255) DEFAULT NULL AFTER `name`',
    'SELECT "customer_name column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add laundry_items column after phone
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND COLUMN_NAME = 'laundry_items') = 0,
    'ALTER TABLE `register` ADD COLUMN `laundry_items` JSON DEFAULT NULL AFTER `phone`',
    'SELECT "laundry_items column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add drop_off_date column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND COLUMN_NAME = 'drop_off_date') = 0,
    'ALTER TABLE `register` ADD COLUMN `drop_off_date` datetime DEFAULT NULL AFTER `laundry_items`',
    'SELECT "drop_off_date column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add pickup_date column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND COLUMN_NAME = 'pickup_date') = 0,
    'ALTER TABLE `register` ADD COLUMN `pickup_date` datetime DEFAULT NULL AFTER `drop_off_date`',
    'SELECT "pickup_date column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add delivery_status column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND COLUMN_NAME = 'delivery_status') = 0,
    'ALTER TABLE `register` ADD COLUMN `delivery_status` enum(''pending'',''ready'',''delivered'',''cancelled'') DEFAULT ''pending'' AFTER `pickup_date`',
    'SELECT "delivery_status column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add total_amount column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND COLUMN_NAME = 'total_amount') = 0,
    'ALTER TABLE `register` ADD COLUMN `total_amount` decimal(10,2) DEFAULT 0.00 AFTER `delivery_status`',
    'SELECT "total_amount column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add paid_amount column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND COLUMN_NAME = 'paid_amount') = 0,
    'ALTER TABLE `register` ADD COLUMN `paid_amount` decimal(10,2) DEFAULT 0.00 AFTER `total_amount`',
    'SELECT "paid_amount column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add payment_status column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND COLUMN_NAME = 'payment_status') = 0,
    'ALTER TABLE `register` ADD COLUMN `payment_status` enum(''pending'',''partial'',''paid'') DEFAULT ''pending'' AFTER `paid_amount`',
    'SELECT "payment_status column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add notes column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND COLUMN_NAME = 'notes') = 0,
    'ALTER TABLE `register` ADD COLUMN `notes` text DEFAULT NULL AFTER `payment_status`',
    'SELECT "notes column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add receipt_number column
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND COLUMN_NAME = 'receipt_number') = 0,
    'ALTER TABLE `register` ADD COLUMN `receipt_number` varchar(50) DEFAULT NULL AFTER `notes`',
    'SELECT "receipt_number column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for better performance (only if they don't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND INDEX_NAME = 'idx_register_phone') = 0,
    'ALTER TABLE `register` ADD INDEX `idx_register_phone` (`phone`)',
    'SELECT "idx_register_phone index already exists"'
));PARE stmt FROM @sql;
EX
PREECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND INDEX_NAME = 'idx_register_delivery_status') = 0,
    'ALTER TABLE `register` ADD INDEX `idx_register_delivery_status` (`delivery_status`)',
    'SELECT "idx_register_delivery_status index already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND INDEX_NAME = 'idx_register_payment_status') = 0,
    'ALTER TABLE `register` ADD INDEX `idx_register_payment_status` (`payment_status`)',
    'SELECT "idx_register_payment_status index already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND INDEX_NAME = 'idx_register_drop_off_date') = 0,
    'ALTER TABLE `register` ADD INDEX `idx_register_drop_off_date` (`drop_off_date`)',
    'SELECT "idx_register_drop_off_date index already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'register' 
     AND INDEX_NAME = 'idx_register_pickup_date') = 0,
    'ALTER TABLE `register` ADD INDEX `idx_register_pickup_date` (`pickup_date`)',
    'SELECT "idx_register_pickup_date index already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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

-- Display success message
SELECT 'Register table migration completed successfully!' AS message;