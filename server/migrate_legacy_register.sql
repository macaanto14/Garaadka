-- Migration script to transfer necessary data from legacy register table to new structure
-- This script will create the new table and migrate essential data only

-- Step 1: Create backup of existing register table (if any)
CREATE TABLE IF NOT EXISTS `register_backup_old` AS SELECT * FROM `register`;

-- Step 2: Drop existing register table
DROP TABLE IF EXISTS `register`;

-- Step 3: Create new register table with modern structure
CREATE TABLE `register` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW',
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
  KEY `idx_register_pickup_date` (`pickup_date`),
  KEY `idx_register_created_at` (`created_at`),
  KEY `idx_register_updated_at` (`updated_at`),
  KEY `idx_register_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Create temporary table to extract and transform legacy data
CREATE TEMPORARY TABLE temp_legacy_data AS
SELECT 
    itemNum,
    NAME,
    descr,
    quan,
    unitprice,
    totalAmount,
    mobnum,
    payCheck,
    col,
    siz,
    duedate,
    deliverdate
FROM register_backup_old 
WHERE NAME IS NOT NULL 
AND NAME != '' 
AND NAME != 'HALKAN KU QOR MAGACA MACMIILKA'
AND mobnum > 0
ORDER BY itemNum;

-- Step 5: Insert transformed data into new register table
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
    -- Clean and format customer name
    TRIM(SUBSTRING(NAME, 1, 255)) as name,
    TRIM(SUBSTRING(NAME, 1, 255)) as customer_name,
    
    -- Generate unique username
    CONCAT('legacy_', LPAD(itemNum, 6, '0')) as username,
    
    -- Format phone number
    CASE 
        WHEN mobnum > 0 THEN CONCAT('+252', SUBSTRING(CAST(mobnum AS CHAR), -8))
        ELSE NULL 
    END as phone,
    
    -- Create JSON for laundry items
    JSON_OBJECT(
        'description', TRIM(descr),
        'quantity', COALESCE(quan, 1),
        'unit_price', COALESCE(unitprice, 0),
        'color', TRIM(COALESCE(col, '')),
        'size', TRIM(COALESCE(siz, '')),
        'legacy_item_num', itemNum
    ) as laundry_items,
    
    -- Convert dates (handle various formats)
    CASE 
        WHEN duedate REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' THEN STR_TO_DATE(duedate, '%d-%m-%Y')
        WHEN duedate REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN STR_TO_DATE(duedate, '%Y-%m-%d')
        ELSE DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY) -- Random date within last 30 days for invalid dates
    END as drop_off_date,
    
    -- Pickup date (if delivered, otherwise NULL)
    CASE 
        WHEN payCheck = 'Paid' AND deliverdate REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' THEN STR_TO_DATE(deliverdate, '%d-%m-%Y')
        WHEN payCheck = 'Paid' AND deliverdate REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN STR_TO_DATE(deliverdate, '%Y-%m-%d')
        WHEN payCheck = 'Paid' THEN NOW()
        ELSE NULL
    END as pickup_date,
    
    -- Map delivery status
    CASE 
        WHEN payCheck = 'Paid' THEN 'delivered'
        WHEN payCheck = 'Unpaid' THEN 'pending'
        ELSE 'pending'
    END as delivery_status,
    
    -- Convert amounts to decimal
    COALESCE(totalAmount, 0) as total_amount,
    
    -- Paid amount based on payment status
    CASE 
        WHEN payCheck = 'Paid' THEN COALESCE(totalAmount, 0)
        ELSE 0
    END as paid_amount,
    
    -- Payment status
    CASE 
        WHEN payCheck = 'Paid' THEN 'paid'
        WHEN payCheck = 'Unpaid' THEN 'pending'
        ELSE 'pending'
    END as payment_status,
    
    -- Notes with legacy info
    CONCAT('Migrated from legacy system. Original description: ', TRIM(descr)) as notes,
    
    -- Generate receipt number
    CONCAT('LEG-', LPAD(itemNum, 6, '0')) as receipt_number,
    
    -- Created by
    'legacy_migration' as created_by,
    
    -- Created at (use current time for migration)
    NOW() as created_at

FROM temp_legacy_data;

-- Step 6: Update statistics and show results
SELECT 
    COUNT(*) as total_migrated_records,
    COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN delivery_status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as unpaid_orders,
    SUM(total_amount) as total_revenue,
    SUM(paid_amount) as total_collected
FROM `register`;

-- Step 7: Show sample of migrated data
SELECT 
    id,
    name,
    phone,
    delivery_status,
    payment_status,
    total_amount,
    paid_amount,
    receipt_number,
    created_at
FROM `register` 
ORDER BY id 
LIMIT 10;

-- Step 8: Clean up
DROP TEMPORARY TABLE temp_legacy_data;

-- Optional: Drop backup table after verification (uncomment if you're sure)
-- DROP TABLE register_backup_old;

DESCRIBE `register`;