-- SQL Script to remove email and address columns from customers table
-- Run this script to update your database schema

USE `loundary`;

-- First, let's backup the data (optional - uncomment if you want to keep the data)
-- CREATE TABLE customers_backup AS SELECT * FROM customers;

-- Remove the email column
ALTER TABLE `customers` DROP COLUMN `email`;

-- Remove the address column  
ALTER TABLE `customers` DROP COLUMN `address`;

-- Verify the changes
DESCRIBE `customers`;

-- Optional: Show the updated table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_SCHEMA = 'loundary' 
    AND TABLE_NAME = 'customers'
ORDER BY 
    ORDINAL_POSITION;