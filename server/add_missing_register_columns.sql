-- Add missing laundry-specific columns to the register table
-- This script will update the existing register table to support laundry business operations

-- Step 1: Add missing columns to register table for laundry functionality
ALTER TABLE `register` 
ADD COLUMN IF NOT EXISTS `customer_name` varchar(255) DEFAULT NULL AFTER `name`,
ADD COLUMN IF NOT EXISTS `laundry_items` TEXT DEFAULT NULL AFTER `phone`,
ADD COLUMN IF NOT EXISTS `drop_off_date` datetime DEFAULT NULL AFTER `laundry_items`,
ADD COLUMN IF NOT EXISTS `pickup_date` datetime DEFAULT NULL AFTER `drop_off_date`,
ADD COLUMN IF NOT EXISTS `delivery_status` enum('pending','ready','delivered','cancelled') DEFAULT 'pending' AFTER `pickup_date`,
ADD COLUMN IF NOT EXISTS `total_amount` decimal(10,2) DEFAULT 0.00 AFTER `delivery_status`,
ADD COLUMN IF NOT EXISTS `paid_amount` decimal(10,2) DEFAULT 0.00 AFTER `total_amount`,
ADD COLUMN IF NOT EXISTS `payment_status` enum('pending','partial','paid') DEFAULT 'pending' AFTER `paid_amount`,
ADD COLUMN IF NOT EXISTS `notes` text DEFAULT NULL AFTER `payment_status`,
ADD COLUMN IF NOT EXISTS `receipt_number` varchar(50) DEFAULT NULL AFTER `notes`;

-- Step 2: Add indexes for new columns to improve performance
ALTER TABLE `register`
ADD INDEX IF NOT EXISTS `idx_register_delivery_status` (`delivery_status`),
ADD INDEX IF NOT EXISTS `idx_register_payment_status` (`payment_status`),
ADD INDEX IF NOT EXISTS `idx_register_drop_off_date` (`drop_off_date`),
ADD INDEX IF NOT EXISTS `idx_register_pickup_date` (`pickup_date`),
ADD INDEX IF NOT EXISTS `idx_register_receipt_number` (`receipt_number`);

-- Step 3: Verify the table structure
-- Check current register table structure and add any missing columns if needed
-- This script works with the actual legacy register table structure

-- Step 1: Show current table structure
SELECT 'Current Register Table Structure:' as info;
DESCRIBE `register`;

-- Step 2: Check if we need to add any modern columns to the legacy table
-- Note: The legacy table already has all the data we need, just in different column names
-- We don't actually need to add new columns since the API has been updated to work with legacy structure

-- Step 3: Show current record count and statistics
SELECT 
    'Current Register Table Status:' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN payCheck = 'Paid' THEN 1 END) as paid_records,
    COUNT(CASE WHEN payCheck = 'Unpaid' THEN 1 END) as unpaid_records,
    COUNT(DISTINCT mobnum) as unique_customers,
    SUM(totalAmount) as total_revenue,
    SUM(CASE WHEN payCheck = 'Paid' THEN totalAmount ELSE 0 END) as total_collected
FROM `register`
WHERE NAME != 'HALKAN KU QOR MAGACA MACMIILKA' AND NAME != 'Test';

-- Step 4: Show sample data to verify the API mapping will work
SELECT 'Sample Register Data (showing API field mapping):' as info;
SELECT 
    itemNum as 'id (itemNum)',
    NAME as 'name/customer_name (NAME)',
    CONCAT('+252', RIGHT(CAST(mobnum AS CHAR), 8)) as 'phone (formatted mobnum)',
    descr as 'laundry_items (descr)',
    STR_TO_DATE(duedate, '%d-%m-%Y') as 'drop_off_date (duedate)',
    CASE 
        WHEN deliverdate != 'Delivery Date' AND deliverdate != 'null' 
        THEN STR_TO_DATE(deliverdate, '%d-%m-%Y') 
        ELSE NULL 
    END as 'pickup_date (deliverdate)',
    CASE 
        WHEN deliverdate != 'Delivery Date' AND deliverdate != 'null' THEN 'delivered'
        ELSE 'pending'
    END as 'delivery_status (derived)',
    totalAmount as 'total_amount (totalAmount)',
    CASE WHEN payCheck = 'Paid' THEN totalAmount ELSE 0 END as 'paid_amount (derived)',
    payCheck as 'payment_status (payCheck)',
    CONCAT('Color: ', col, ' | Size: ', siz) as 'notes (col + siz)',
    CONCAT('REG-', LPAD(itemNum, 6, '0')) as 'receipt_number (generated)'
FROM `register` 
WHERE NAME != 'HALKAN KU QOR MAGACA MACMIILKA' AND NAME != 'Test'
ORDER BY itemNum 
LIMIT 5;

-- Step 5: Verify phone number formatting
SELECT 'Phone Number Format Examples:' as info;
SELECT 
    itemNum,
    NAME,
    mobnum as original_mobnum,
    CONCAT('+252', RIGHT(CAST(mobnum AS CHAR), 8)) as formatted_phone,
    LENGTH(CAST(mobnum AS CHAR)) as phone_length
FROM `register` 
WHERE NAME != 'HALKAN KU QOR MAGACA MACMIILKA' AND NAME != 'Test'
AND mobnum > 0
ORDER BY itemNum 
LIMIT 10;

SELECT 'Register table is ready to use with the updated API!' as status;
SELECT 'No additional columns needed - API has been updated to work with legacy structure' as note;
-- Step 4: Show current record count
SELECT 
    'Current Register Table Status:' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_records,
    COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_records
FROM `register`;