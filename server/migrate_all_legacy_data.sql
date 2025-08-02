-- Migration script to import all 13,000+ legacy register records
-- This script imports from the legacy.sql structure to the enhanced register table

-- Step 1: First, let's create a temporary table with the legacy structure
DROP TABLE IF EXISTS `legacy_register_temp`;
CREATE TABLE `legacy_register_temp` (
  `itemNum` int(15) NOT NULL,
  `NAME` varchar(100) NOT NULL,
  `descr` varchar(200) NOT NULL,
  `quan` int(30) DEFAULT NULL,
  `unitprice` int(30) DEFAULT NULL,
  `amntword` varchar(100) DEFAULT NULL,
  `duedate` varchar(100) NOT NULL,
  `deliverdate` varchar(100) NOT NULL,
  `totalAmount` int(30) NOT NULL,
  `mobnum` int(12) NOT NULL,
  `payCheck` varchar(50) NOT NULL,
  `col` varchar(100) DEFAULT NULL,
  `siz` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`itemNum`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Step 2: Import the legacy data (you'll need to run the INSERT statements from legacy.sql)
-- For now, let's assume the legacy data is already in a table called `legacy_register`
-- If not, you can manually copy the INSERT statements from legacy.sql

-- Step 3: Backup current register table
DROP TABLE IF EXISTS `register_before_migration`;
CREATE TABLE `register_before_migration` AS SELECT * FROM `register`;

-- Step 4: Clear current register table but keep the enhanced structure
DELETE FROM `register`;

-- Step 5: Reset auto increment to start fresh
ALTER TABLE `register` AUTO_INCREMENT = 1;

-- Step 6: Import all legacy data with proper transformation
INSERT INTO `register` (
    `name`,
    `customer_name`,
    `username`,
    `password`,
    `email`,
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
    `role`,
    `status`,
    `created_by`,
    `created_at`
)
SELECT 
    -- Customer name (clean up the name field)
    TRIM(SUBSTRING(NAME, 1, 255)) as name,
    TRIM(SUBSTRING(NAME, 1, 255)) as customer_name,
    
    -- Generate unique username from legacy itemNum
    CONCAT('legacy_', LPAD(itemNum, 6, '0')) as username,
    
    -- Default password for all legacy users
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW' as password,
    
    -- Generate email from name (optional)
    CASE 
        WHEN LENGTH(TRIM(NAME)) > 0 THEN 
            CONCAT(LOWER(REPLACE(REPLACE(TRIM(SUBSTRING(NAME, 1, 20)), ' ', ''), '-', '')), '@legacy.local')
        ELSE NULL 
    END as email,
    
    -- Format phone number for Somalia
    CASE 
        WHEN mobnum > 0 AND LENGTH(CAST(mobnum AS CHAR)) >= 8 THEN 
            CONCAT('+252', RIGHT(CAST(mobnum AS CHAR), 8))
        WHEN mobnum > 0 AND LENGTH(CAST(mobnum AS CHAR)) >= 7 THEN 
            CONCAT('+252', LPAD(CAST(mobnum AS CHAR), 8, '0'))
        WHEN mobnum > 0 THEN 
            CONCAT('+252', LPAD(CAST(mobnum AS CHAR), 8, '0'))
        ELSE NULL 
    END as phone,
    
    -- Create structured laundry items description
    CONCAT(
        'Items: ', TRIM(COALESCE(descr, '')),
        ' | Quantity: ', COALESCE(quan, 1),
        ' | Unit Price: $', COALESCE(unitprice, 0),
        CASE WHEN TRIM(COALESCE(col, '')) != '' AND TRIM(COALESCE(col, '')) != 'Color' 
             THEN CONCAT(' | Color: ', TRIM(col)) ELSE '' END,
        CASE WHEN TRIM(COALESCE(siz, '')) != '' AND TRIM(COALESCE(siz, '')) != 'Size' 
             THEN CONCAT(' | Size: ', TRIM(siz)) ELSE '' END,
        ' | Legacy Item #', itemNum
    ) as laundry_items,
    
    -- Convert drop-off date (handle DD-MM-YYYY format)
    CASE 
        WHEN duedate REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' THEN 
            STR_TO_DATE(duedate, '%d-%m-%Y')
        WHEN duedate REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN 
            STR_TO_DATE(duedate, '%Y-%m-%d')
        WHEN duedate IS NOT NULL AND duedate != 'null' AND duedate != '' AND duedate != 'Delivery Date' THEN
            STR_TO_DATE(CONCAT('01-01-2023'), '%d-%m-%Y')  -- Default to 2023 if can't parse
        ELSE STR_TO_DATE('15-08-2023', '%d-%m-%Y')  -- Default date from your data
    END as drop_off_date,
    
    -- Convert pickup date (only if paid and has valid delivery date)
    CASE 
        WHEN payCheck = 'Paid' AND deliverdate REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' THEN 
            STR_TO_DATE(deliverdate, '%d-%m-%Y')
        WHEN payCheck = 'Paid' AND deliverdate REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN 
            STR_TO_DATE(deliverdate, '%Y-%m-%d')
        WHEN payCheck = 'Paid' AND deliverdate != 'Delivery Date' AND deliverdate != 'null' THEN
            DATE_ADD(
                CASE 
                    WHEN duedate REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' THEN STR_TO_DATE(duedate, '%d-%m-%Y')
                    ELSE STR_TO_DATE('15-08-2023', '%d-%m-%Y')
                END, 
                INTERVAL 2 DAY
            )
        ELSE NULL
    END as pickup_date,
    
    -- Map delivery status based on payment
    CASE 
        WHEN payCheck = 'Paid' THEN 'delivered'
        WHEN payCheck = 'Unpaid' THEN 'pending'
        WHEN payCheck = 'null' THEN 'pending'
        ELSE 'pending'
    END as delivery_status,
    
    -- Convert total amount
    COALESCE(totalAmount, 0) as total_amount,
    
    -- Set paid amount based on payment status
    CASE 
        WHEN payCheck = 'Paid' THEN COALESCE(totalAmount, 0)
        ELSE 0
    END as paid_amount,
    
    -- Map payment status
    CASE 
        WHEN payCheck = 'Paid' THEN 'paid'
        WHEN payCheck = 'Unpaid' THEN 'pending'
        WHEN payCheck = 'null' THEN 'pending'
        ELSE 'pending'
    END as payment_status,
    
    -- Create notes with legacy information
    CONCAT(
        'Migrated from legacy system. ',
        'Original description: ', TRIM(COALESCE(descr, '')),
        CASE WHEN TRIM(COALESCE(amntword, '')) != '' AND TRIM(COALESCE(amntword, '')) != 'Amount in Words' 
             THEN CONCAT(' | Amount in words: ', TRIM(amntword)) ELSE '' END
    ) as notes,
    
    -- Generate receipt number from legacy itemNum
    CONCAT('LEG-', LPAD(itemNum, 6, '0')) as receipt_number,
    
    -- Set role and status
    'user' as role,
    'active' as status,
    
    -- Set created by
    'legacy_migration' as created_by,
    
    -- Set created date based on drop-off date
    CASE 
        WHEN duedate REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' THEN 
            STR_TO_DATE(duedate, '%d-%m-%Y')
        ELSE STR_TO_DATE('15-08-2023', '%d-%m-%Y')
    END as created_at

FROM `legacy_register_temp`
WHERE NAME IS NOT NULL 
AND NAME != '' 
AND NAME != 'HALKAN KU QOR MAGACA MACMIILKA'  -- Exclude placeholder entries
AND NAME != 'Test'  -- Exclude test entries
AND TRIM(NAME) != ''
AND mobnum > 0
AND itemNum IS NOT NULL
ORDER BY itemNum;

-- Step 7: Show migration statistics
SELECT 'Legacy Data Migration Results:' as info;

SELECT 
    COUNT(*) as total_migrated_records,
    COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN delivery_status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as unpaid_orders,
    SUM(total_amount) as total_revenue,
    SUM(paid_amount) as total_collected,
    (SUM(total_amount) - SUM(paid_amount)) as outstanding_balance,
    MIN(drop_off_date) as earliest_order,
    MAX(drop_off_date) as latest_order
FROM `register`;

-- Step 8: Show sample of migrated data
SELECT 'Sample Migrated Legacy Data:' as info;
SELECT 
    id,
    name,
    phone,
    delivery_status,
    payment_status,
    total_amount,
    paid_amount,
    (total_amount - paid_amount) as balance,
    receipt_number,
    SUBSTRING(laundry_items, 1, 60) as items_preview,
    drop_off_date,
    pickup_date
FROM `register` 
ORDER BY id 
LIMIT 15;

-- Step 9: Show customers with highest orders
SELECT 'Top Customers by Order Value:' as info;
SELECT 
    name,
    phone,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_spent,
    SUM(paid_amount) as total_paid,
    (SUM(total_amount) - SUM(paid_amount)) as balance
FROM `register`
GROUP BY name, phone
HAVING COUNT(*) > 1
ORDER BY total_spent DESC
LIMIT 10;

-- Step 10: Show payment status summary
SELECT 'Payment Status Summary:' as info;
SELECT 
    payment_status,
    COUNT(*) as order_count,
    SUM(total_amount) as total_amount,
    SUM(paid_amount) as paid_amount,
    (SUM(total_amount) - SUM(paid_amount)) as outstanding
FROM `register`
GROUP BY payment_status;

SELECT 'Migration completed successfully!' as status;
SELECT CONCAT('Total records migrated: ', COUNT(*)) as final_count FROM `register`;