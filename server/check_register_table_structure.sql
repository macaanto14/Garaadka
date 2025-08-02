-- Diagnostic script to check current register table structure
-- Run this first to understand what we're working with

-- Check if the table exists
SHOW TABLES LIKE 'register';

-- Show current table structure
DESCRIBE `register`;

-- Show table creation statement
SHOW CREATE TABLE `register`;

-- Check for existing AUTO_INCREMENT columns
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_KEY, 
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'register'
ORDER BY ORDINAL_POSITION;