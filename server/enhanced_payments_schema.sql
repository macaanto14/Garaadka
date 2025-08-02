-- Enhanced Payment System Database Schema
USE `loundary`;

-- Update payments table with additional fields for comprehensive payment tracking
ALTER TABLE `payments` 
ADD COLUMN IF NOT EXISTS `payment_id` INT AUTO_INCREMENT PRIMARY KEY FIRST,
ADD COLUMN IF NOT EXISTS `order_id` INT NOT NULL,
ADD COLUMN IF NOT EXISTS `payment_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS `amount` DECIMAL(10, 2) NOT NULL,
ADD COLUMN IF NOT EXISTS `payment_method` ENUM('cash', 'ebirr', 'cbe', 'bank_transfer', 'credit_card', 'debit_card') NOT NULL,
ADD COLUMN IF NOT EXISTS `reference_number` VARCHAR(100),
ADD COLUMN IF NOT EXISTS `transaction_id` VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS `status` ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS `notes` TEXT,
ADD COLUMN IF NOT EXISTS `processed_by` VARCHAR(100),
ADD COLUMN IF NOT EXISTS `receipt_number` VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS `refund_amount` DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS `refund_reason` TEXT,
ADD COLUMN IF NOT EXISTS `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS `created_by` VARCHAR(100),
ADD COLUMN IF NOT EXISTS `updated_by` VARCHAR(100),
ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL,
ADD COLUMN IF NOT EXISTS `deleted_by` VARCHAR(100),
ADD INDEX IF NOT EXISTS `idx_order` (`order_id`),
ADD INDEX IF NOT EXISTS `idx_payment_date` (`payment_date`),
ADD INDEX IF NOT EXISTS `idx_payment_method` (`payment_method`),
ADD INDEX IF NOT EXISTS `idx_status` (`status`),
ADD INDEX IF NOT EXISTS `idx_receipt_number` (`receipt_number`),
ADD INDEX IF NOT EXISTS `idx_transaction_id` (`transaction_id`),
ADD FOREIGN KEY IF NOT EXISTS `fk_payment_order` (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE;

-- Create payment_receipts table for receipt management
CREATE TABLE IF NOT EXISTS `payment_receipts` (
  `receipt_id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_id` INT NOT NULL,
  `receipt_number` VARCHAR(50) UNIQUE NOT NULL,
  `receipt_data` JSON,
  `generated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `generated_by` VARCHAR(100),
  `printed_at` DATETIME NULL,
  `email_sent_at` DATETIME NULL,
  `sms_sent_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`payment_id`) REFERENCES `payments`(`payment_id`) ON DELETE CASCADE,
  INDEX `idx_payment` (`payment_id`),
  INDEX `idx_receipt_number` (`receipt_number`)
);

-- Create payment_refunds table for refund tracking
CREATE TABLE IF NOT EXISTS `payment_refunds` (
  `refund_id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_id` INT NOT NULL,
  `refund_amount` DECIMAL(10, 2) NOT NULL,
  `refund_reason` TEXT NOT NULL,
  `refund_method` ENUM('cash', 'ebirr', 'cbe', 'bank_transfer', 'credit_card', 'debit_card') NOT NULL,
  `refund_reference` VARCHAR(100),
  `status` ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  `processed_by` VARCHAR(100),
  `processed_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` VARCHAR(100),
  `updated_by` VARCHAR(100),
  FOREIGN KEY (`payment_id`) REFERENCES `payments`(`payment_id`) ON DELETE CASCADE,
  INDEX `idx_payment` (`payment_id`),
  INDEX `idx_status` (`status`)
);

-- Create payment_methods table for dynamic payment method configuration
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `method_id` INT AUTO_INCREMENT PRIMARY KEY,
  `method_code` VARCHAR(50) UNIQUE NOT NULL,
  `method_name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `requires_reference` BOOLEAN DEFAULT FALSE,
  `icon` VARCHAR(255),
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_active` (`is_active`),
  INDEX `idx_sort` (`sort_order`)
);

-- Insert default payment methods
INSERT IGNORE INTO `payment_methods` (`method_code`, `method_name`, `description`, `requires_reference`, `sort_order`) VALUES
('cash', 'Cash', 'Cash payment', FALSE, 1),
('ebirr', 'E-Birr', 'E-Birr mobile payment', TRUE, 2),
('cbe', 'CBE Birr', 'Commercial Bank of Ethiopia mobile payment', TRUE, 3),
('bank_transfer', 'Bank Transfer', 'Bank to bank transfer', TRUE, 4),
('credit_card', 'Credit Card', 'Credit card payment', TRUE, 5),
('debit_card', 'Debit Card', 'Debit card payment', TRUE, 6);

-- Create payment_analytics table for reporting
CREATE TABLE IF NOT EXISTS `payment_analytics` (
  `analytics_id` INT AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL,
  `payment_method` VARCHAR(50),
  `total_amount` DECIMAL(12, 2) DEFAULT 0.00,
  `total_count` INT DEFAULT 0,
  `avg_amount` DECIMAL(10, 2) DEFAULT 0.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_date_method` (`date`, `payment_method`),
  INDEX `idx_date` (`date`),
  INDEX `idx_method` (`payment_method`)
);

-- Trigger to generate receipt numbers
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `generate_receipt_number` 
BEFORE INSERT ON `payments`
FOR EACH ROW
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    SET NEW.receipt_number = CONCAT('RCP-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD((
      SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number, -4) AS UNSIGNED)), 0) + 1
      FROM payments 
      WHERE DATE(payment_date) = CURDATE() 
      AND receipt_number LIKE CONCAT('RCP-', DATE_FORMAT(NOW(), '%Y%m%d'), '-%')
    ), 4, '0'));
  END IF;
  
  IF NEW.transaction_id IS NULL OR NEW.transaction_id = '' THEN
    SET NEW.transaction_id = CONCAT('TXN-', UNIX_TIMESTAMP(), '-', CONNECTION_ID());
  END IF;
END//
DELIMITER ;

-- Trigger to update payment analytics
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `update_payment_analytics` 
AFTER INSERT ON `payments`
FOR EACH ROW
BEGIN
  INSERT INTO payment_analytics (date, payment_method, total_amount, total_count, avg_amount)
  VALUES (DATE(NEW.payment_date), NEW.payment_method, NEW.amount, 1, NEW.amount)
  ON DUPLICATE KEY UPDATE
    total_amount = total_amount + NEW.amount,
    total_count = total_count + 1,
    avg_amount = (total_amount + NEW.amount) / (total_count + 1),
    updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;