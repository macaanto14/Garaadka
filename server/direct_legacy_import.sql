-- Direct import assuming legacy.sql has been imported into database

-- Backup current register
CREATE TABLE `register_backup_before_legacy` AS SELECT * FROM `register`;

-- Clear current register
DELETE FROM `register`;
ALTER TABLE `register` AUTO_INCREMENT = 1;

-- Import directly from legacy register table (if it exists)
INSERT INTO `register` (name, customer_name, username, phone, laundry_items, drop_off_date, pickup_date, delivery_status, total_amount, paid_amount, payment_status, notes, receipt_number, role, status, created_by, created_at)
SELECT 
    TRIM(SUBSTRING(NAME, 1, 255)),
    TRIM(SUBSTRING(NAME, 1, 255)),
    CONCAT('legacy_', LPAD(itemNum, 6, '0')),
    CONCAT('+252', RIGHT(LPAD(CAST(mobnum AS CHAR), 9, '0'), 8)),
    CONCAT('Items: ', descr, ' | Qty: ', quan, ' | Price: $', unitprice, ' | Color: ', col, ' | Size: ', siz),
    STR_TO_DATE(duedate, '%d-%m-%Y'),
    CASE WHEN payCheck = 'Paid' THEN STR_TO_DATE(deliverdate, '%d-%m-%Y') ELSE NULL END,
    CASE WHEN payCheck = 'Paid' THEN 'delivered' ELSE 'pending' END,
    totalAmount,
    CASE WHEN payCheck = 'Paid' THEN totalAmount ELSE 0 END,
    CASE WHEN payCheck = 'Paid' THEN 'paid' ELSE 'pending' END,
    CONCAT('Legacy: ', descr),
    CONCAT('LEG-', LPAD(itemNum, 6, '0')),
    'user',
    'active',
    'legacy_migration',
    STR_TO_DATE(duedate, '%d-%m-%Y')
FROM `register` 
WHERE NAME != 'HALKAN KU QOR MAGACA MACMIILKA' AND NAME != 'Test' AND mobnum > 0;