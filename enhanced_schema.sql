-- Enhanced Database Schema for Garaad wil waal Laundry Management System

USE `loundary`;

-- Create customers table for proper customer registration
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_name` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(20) UNIQUE NOT NULL,
  `email` VARCHAR(255),
  `address` TEXT,
  `registration_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `notes` TEXT,
  INDEX `idx_phone` (`phone_number`),
  INDEX `idx_name` (`customer_name`)
);

-- Create orders table (enhanced version of register table)
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) UNIQUE NOT NULL,
  `customer_id` INT NOT NULL,
  `order_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `due_date` DATE NOT NULL,
  `delivery_date` DATE,
  `status` ENUM('pending', 'washing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
  `payment_status` ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
  `payment_method` ENUM('cash', 'ebirr', 'cbe', 'bank_transfer') DEFAULT 'cash',
  `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(10, 2) DEFAULT 0.00,
  `discount` DECIMAL(10, 2) DEFAULT 0.00,
  `notes` TEXT,
  `created_by` VARCHAR(100),
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON DELETE CASCADE,
  INDEX `idx_order_number` (`order_number`),
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_payment_status` (`payment_status`)
);

-- Create order_items table for multiple items per order
CREATE TABLE IF NOT EXISTS `order_items` (
  `item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total_price` DECIMAL(10, 2) GENERATED ALWAYS AS (`quantity` * `unit_price`) STORED,
  `color` VARCHAR(100),
  `size` VARCHAR(50),
  `special_instructions` TEXT,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE,
  INDEX `idx_order` (`order_id`)
);

-- Create payments table for payment tracking
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `payment_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `amount` DECIMAL(10, 2) NOT NULL,
  `payment_method` ENUM('cash', 'ebirr', 'cbe', 'bank_transfer') NOT NULL,
  `reference_number` VARCHAR(100),
  `notes` TEXT,
  `processed_by` VARCHAR(100),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE,
  INDEX `idx_order` (`order_id`),
  INDEX `idx_payment_date` (`payment_date`)
);

-- Enhanced audit table
ALTER TABLE `audit` 
ADD COLUMN `table_name` VARCHAR(50),
ADD COLUMN `record_id` INT,
ADD COLUMN `action_type` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') DEFAULT 'CREATE',
ADD COLUMN `old_values` JSON,
ADD COLUMN `new_values` JSON;

-- Create triggers for automatic order number generation
DELIMITER //
CREATE TRIGGER `generate_order_number` 
BEFORE INSERT ON `orders`
FOR EACH ROW
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    SET NEW.order_number = CONCAT('ORD-', YEAR(NOW()), MONTH(NOW()), '-', LPAD(LAST_INSERT_ID() + 1, 4, '0'));
  END IF;
END//
DELIMITER ;

-- Insert sample customers (migrating from existing register table if exists)
INSERT IGNORE INTO `customers` (`customer_name`, `phone_number`, `registration_date`) 
SELECT DISTINCT `NAME`, `mobnum`, NOW() 
FROM `register` 
WHERE `NAME` IS NOT NULL AND `mobnum` IS NOT NULL;