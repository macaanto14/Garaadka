-- Add audit columns to all tables
-- Run this script to add created_at, updated_at, deleted_at columns with user tracking

-- 1. Add audit columns to customers table
ALTER TABLE `customers` 
ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN `created_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `updated_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `deleted_by` VARCHAR(100) DEFAULT NULL;

-- Update existing customers to have created_at from registration_date
UPDATE `customers` SET `created_at` = `registration_date` WHERE `registration_date` IS NOT NULL;

-- 2. Add audit columns to orders table (already has updated_at, so we add the missing ones)
ALTER TABLE `orders`
ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN `updated_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `deleted_by` VARCHAR(100) DEFAULT NULL;

-- Rename order_date to created_at for consistency
ALTER TABLE `orders` 
ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing orders to have created_at from order_date
UPDATE `orders` SET `created_at` = `order_date` WHERE `order_date` IS NOT NULL;

-- 3. Add audit columns to order_items table
ALTER TABLE `order_items`
ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN `created_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `updated_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `deleted_by` VARCHAR(100) DEFAULT NULL;

-- 4. Add audit columns to payments table
ALTER TABLE `payments`
ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN `created_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `updated_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `deleted_by` VARCHAR(100) DEFAULT NULL;

-- Update existing payments to have created_at from payment_date
UPDATE `payments` SET `created_at` = `payment_date` WHERE `payment_date` IS NOT NULL;

-- 5. Add audit columns to register table
ALTER TABLE `register`
ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN `created_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `updated_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `deleted_by` VARCHAR(100) DEFAULT NULL;

-- 6. Add audit columns to user accounts table
ALTER TABLE `user accounts`
ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN `created_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `updated_by` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `deleted_by` VARCHAR(100) DEFAULT NULL;

-- Create indexes for better performance on audit columns
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_updated_at ON customers(updated_at);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);

CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_deleted_at ON orders(deleted_at);

CREATE INDEX idx_order_items_created_at ON order_items(created_at);
CREATE INDEX idx_order_items_updated_at ON order_items(updated_at);
CREATE INDEX idx_order_items_deleted_at ON order_items(deleted_at);

CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_updated_at ON payments(updated_at);
CREATE INDEX idx_payments_deleted_at ON payments(deleted_at);

CREATE INDEX idx_register_created_at ON register(created_at);
CREATE INDEX idx_register_updated_at ON register(updated_at);
CREATE INDEX idx_register_deleted_at ON register(deleted_at);

CREATE INDEX `idx_user_accounts_created_at` ON `user accounts`(created_at);
CREATE INDEX `idx_user_accounts_updated_at` ON `user accounts`(updated_at);
CREATE INDEX `idx_user_accounts_deleted_at` ON `user accounts`(deleted_at);