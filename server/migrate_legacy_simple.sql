-- Simplified migration script compatible with MariaDB
-- This version avoids complex JSON operations and uses simpler syntax

-- Step 1: Show current register table structure
SELECT 'Current register table structure:' as info;
DESCRIBE `register`;

-- Step 2: Create a backup table from current register data
DROP TABLE IF EXISTS `register_legacy_backup`;
CREATE TABLE `register_legacy_backup` AS SELECT * FROM `register`;

-- Step 3: Drop existing register table
DROP TABLE IF EXISTS `register`;

-- Step 4: Create new register table with modern structure
CREATE TABLE `register` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW',
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `laundry_items` TEXT DEFAULT NULL,
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
  KEY `idx_register_pickup_date` (`pickup_date`),
  KEY `idx_register_created_at` (`created_at`),
  KEY `idx_register_updated_at` (`updated_at`),
  KEY `idx_register_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Insert transformed data from backup table into new register table
INSERT INTO `register` (
    `name`,
    `customer_name`, 
    `username`,
    `phone`,
    `laundry_items`,
    `drop_off_date`,
    `pickup_date`,
    `delivery_status`,
    `total_amount`,
    `paid_amount`,
    `payment_status`,
    `notes`,
    `receipt_number`,
    `created_by`,
    `created_at`
)
SELECT 
    TRIM(SUBSTRING(NAME, 1, 255)) as name,
    TRIM(SUBSTRING(NAME, 1, 255)) as customer_name,
    CONCAT('legacy_', LPAD(itemNum, 6, '0')) as username,
    CASE 
        WHEN mobnum > 0 AND LENGTH(CAST(mobnum AS CHAR)) >= 8 THEN 
            CONCAT('+252', RIGHT(CAST(mobnum AS CHAR), 8))
        WHEN mobnum > 0 THEN 
            CONCAT('+252', LPAD(CAST(mobnum AS CHAR), 8, '0'))
        ELSE NULL 
    END as phone,
    CONCAT('Description: ', COALESCE(descr, ''), 
           ' | Quantity: ', COALESCE(quan, 1),
           ' | Unit Price: ', COALESCE(unitprice, 0),
           ' | Color: ', COALESCE(col, ''),
           ' | Size: ', COALESCE(siz, ''),
           ' | Legacy Item: ', itemNum) as laundry_items,
    CASE 
        WHEN duedate REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' THEN 
            STR_TO_DATE(duedate, '%d-%m-%Y')
        WHEN duedate REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN 
            STR_TO_DATE(duedate, '%Y-%m-%d')
        ELSE DATE_SUB(NOW(), INTERVAL 30 DAY)
    END as drop_off_date,
    CASE 
        WHEN payCheck = 'Paid' AND deliverdate REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' THEN 
            STR_TO_DATE(deliverdate, '%d-%m-%Y')
        WHEN payCheck = 'Paid' AND deliverdate REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN 
            STR_TO_DATE(deliverdate, '%Y-%m-%d')
        WHEN payCheck = 'Paid' THEN NOW()
        ELSE NULL
    END as pickup_date,
    CASE 
        WHEN payCheck = 'Paid' THEN 'delivered'
        WHEN payCheck = 'Unpaid' THEN 'pending'
        ELSE 'pending'
    END as delivery_status,
    COALESCE(totalAmount, 0) as total_amount,
    CASE 
        WHEN payCheck = 'Paid' THEN COALESCE(totalAmount, 0)
        ELSE 0
    END as paid_amount,
    CASE 
        WHEN payCheck = 'Paid' THEN 'paid'
        WHEN payCheck = 'Unpaid' THEN 'pending'
        ELSE 'pending'
    END as payment_status,
    CONCAT('Migrated from legacy system. Items: ', COALESCE(descr, '')) as notes,
    CONCAT('LEG-', LPAD(itemNum, 6, '0')) as receipt_number,
    'legacy_migration' as created_by,
    CASE 
        WHEN duedate REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' THEN 
            STR_TO_DATE(duedate, '%d-%m-%Y')
        ELSE NOW()
    END as created_at
FROM `register_legacy_backup`
WHERE NAME IS NOT NULL 
AND NAME != '' 
AND NAME != 'HALKAN KU QOR MAGACA MACMIILKA'
AND NAME != 'Test'
AND mobnum > 0
AND itemNum IS NOT NULL
ORDER BY itemNum;

-- Step 6: Show migration results
SELECT 
    'Migration Results:' as info,
    COUNT(*) as total_migrated_records,
    COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN delivery_status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as unpaid_orders,
    SUM(total_amount) as total_revenue,
    SUM(paid_amount) as total_collected
FROM `register`;

-- Step 7: Show sample of migrated data
SELECT 'Sample migrated data:' as info;
SELECT 
    id,
    name,
    phone,
    delivery_status,
    payment_status,
    total_amount,
    paid_amount,
    receipt_number,
    SUBSTRING(laundry_items, 1, 100) as items_preview,
    created_at
FROM `register` 
ORDER BY id 
LIMIT 10;

-- Step 8: Show new table structure
SELECT 'New register table structure:' as info;
DESCRIBE `register`;

SELECT 'Migration completed successfully!' as status;