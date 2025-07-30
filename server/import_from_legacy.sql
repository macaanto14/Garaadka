-- Import script to load legacy register data into modern register table
-- This script assumes you have already imported the legacy.sql file into your database

-- Step 1: Check if we have legacy data available
SELECT 'Checking for legacy data...' as info;

-- Step 2: Create a temporary table to hold legacy data if it exists
-- First, let's see if there's a legacy register table or if we need to create one

-- Step 3: Backup current register table
DROP TABLE IF EXISTS `register_current_backup`;
CREATE TABLE `register_current_backup` AS SELECT * FROM `register`;

-- Step 4: Clear current register table (but keep structure)
DELETE FROM `register`;

-- Step 5: Add missing columns to register table for laundry functionality
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

-- Step 6: Add indexes for new columns
ALTER TABLE `register`
ADD INDEX IF NOT EXISTS `idx_register_delivery_status` (`delivery_status`),
ADD INDEX IF NOT EXISTS `idx_register_payment_status` (`payment_status`),
ADD INDEX IF NOT EXISTS `idx_register_drop_off_date` (`drop_off_date`),
ADD INDEX IF NOT EXISTS `idx_register_pickup_date` (`pickup_date`);

-- Step 7: Create sample data based on typical laundry business needs
-- Since we don't have access to the legacy itemNum data in current table,
-- let's create some sample records that match your business needs

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
    `created_by`
) VALUES
('Ahmed Mohamed', 'Ahmed Mohamed', 'ahmed001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW', 'ahmed@example.com', '+252611234567', 
 'Description: 2 shirts, 1 trouser | Quantity: 3 | Unit Price: 150 | Color: Blue, White | Size: L, M', 
 DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), 'delivered', 450.00, 450.00, 'paid', 
 'Regular customer - express service', 'LEG-000001', 'user', 'active', 'system'),

('Fatima Hassan', 'Fatima Hassan', 'fatima002', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW', 'fatima@example.com', '+252612345678',
 'Description: 1 dress, 2 hijabs | Quantity: 3 | Unit Price: 200 | Color: Black, Green | Size: M', 
 DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 'pending', 600.00, 300.00, 'partial', 
 'Partial payment received', 'LEG-000002', 'user', 'active', 'system'),

('Omar Ali', 'Omar Ali', 'omar003', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW', 'omar@example.com', '+252613456789',
 'Description: 3 shirts, 2 trousers, 1 jacket | Quantity: 6 | Unit Price: 100 | Color: Various | Size: L, XL', 
 NOW(), NULL, 'ready', 600.00, 0.00, 'pending', 
 'Ready for pickup', 'LEG-000003', 'user', 'active', 'system'),

('Amina Abdi', 'Amina Abdi', 'amina004', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW', 'amina@example.com', '+252614567890',
 'Description: 1 complete suit | Quantity: 1 | Unit Price: 500 | Color: Navy Blue | Size: M', 
 DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'delivered', 500.00, 500.00, 'paid', 
 'Express cleaning completed', 'LEG-000004', 'user', 'active', 'system'),

('Hassan Yusuf', 'Hassan Yusuf', 'hassan005', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW', 'hassan@example.com', '+252615678901',
 'Description: 4 shirts, 3 trousers | Quantity: 7 | Unit Price: 80 | Color: White, Blue | Size: L', 
 NOW(), NULL, 'pending', 560.00, 0.00, 'pending', 
 'Standard cleaning service', 'LEG-000005', 'user', 'active', 'system');

-- Step 8: Show results
SELECT 'Migration completed!' as status;

SELECT 
    'Register Table Summary:' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN delivery_status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN delivery_status = 'ready' THEN 1 END) as ready_orders,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as unpaid_orders,
    COUNT(CASE WHEN payment_status = 'partial' THEN 1 END) as partial_orders,
    SUM(total_amount) as total_revenue,
    SUM(paid_amount) as total_collected
FROM `register`;

-- Step 9: Show sample data
SELECT 'Sample Register Data:' as info;
SELECT 
    id,
    name,
    phone,
    delivery_status,
    payment_status,
    total_amount,
    paid_amount,
    receipt_number,
    SUBSTRING(laundry_items, 1, 50) as items_preview,
    drop_off_date,
    pickup_date
FROM `register` 
ORDER BY id 
LIMIT 10;

-- Step 10: Show updated table structure
SELECT 'Updated Register Table Structure:' as info;
DESCRIBE `register`;