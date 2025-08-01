-- Fix user accounts table by adding missing columns
-- This script will add the missing columns to match the complete schema

-- Add status column if it doesn't exist
ALTER TABLE `user accounts` 
ADD COLUMN IF NOT EXISTS `status` enum('active','inactive','suspended') DEFAULT 'active' AFTER `answer`;

-- Add last_login column if it doesn't exist
ALTER TABLE `user accounts` 
ADD COLUMN IF NOT EXISTS `last_login` datetime DEFAULT NULL AFTER `status`;

-- Add audit columns if they don't exist
ALTER TABLE `user accounts` 
ADD COLUMN IF NOT EXISTS `created_at` timestamp DEFAULT current_timestamp() AFTER `last_login`;

ALTER TABLE `user accounts` 
ADD COLUMN IF NOT EXISTS `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER `created_at`;

ALTER TABLE `user accounts` 
ADD COLUMN IF NOT EXISTS `deleted_at` timestamp NULL DEFAULT NULL AFTER `updated_at`;

ALTER TABLE `user accounts` 
ADD COLUMN IF NOT EXISTS `created_by` varchar(100) DEFAULT NULL AFTER `deleted_at`;

ALTER TABLE `user accounts` 
ADD COLUMN IF NOT EXISTS `updated_by` varchar(100) DEFAULT NULL AFTER `created_by`;

ALTER TABLE `user accounts` 
ADD COLUMN IF NOT EXISTS `deleted_by` varchar(100) DEFAULT NULL AFTER `updated_by`;

-- Add indexes for better performance
ALTER TABLE `user accounts` 
ADD INDEX IF NOT EXISTS `idx_user_accounts_created_at` (`created_at`);

ALTER TABLE `user accounts` 
ADD INDEX IF NOT EXISTS `idx_user_accounts_updated_at` (`updated_at`);

ALTER TABLE `user accounts` 
ADD INDEX IF NOT EXISTS `idx_user_accounts_deleted_at` (`deleted_at`);

-- Update existing records to have proper timestamps if they're NULL
UPDATE `user accounts` 
SET 
    `created_at` = COALESCE(`created_at`, CURRENT_TIMESTAMP),
    `updated_at` = COALESCE(`updated_at`, CURRENT_TIMESTAMP),
    `status` = COALESCE(`status`, 'active')
WHERE `created_at` IS NULL OR `updated_at` IS NULL OR `status` IS NULL;

DESCRIBE `user accounts`;

SHOW COLUMNS FROM `user accounts`;