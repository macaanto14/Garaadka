-- MariaDB Compatible Database Setup Script
-- Run this script to create the database with proper collations

-- Drop database if exists (BE CAREFUL - THIS WILL DELETE ALL DATA!)
-- DROP DATABASE IF EXISTS `loundary`;

-- Create database with MariaDB compatible collation
CREATE DATABASE IF NOT EXISTS `loundary` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `loundary`;

-- Show current database and collation
SELECT 
    SCHEMA_NAME as 'Database',
    DEFAULT_CHARACTER_SET_NAME as 'Charset',
    DEFAULT_COLLATION_NAME as 'Collation'
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'loundary';

-- Check MariaDB version and available collations
SELECT VERSION() as 'MariaDB Version';

-- Show available utf8mb4 collations
SHOW COLLATION WHERE Charset = 'utf8mb4' AND Collation LIKE '%unicode%';