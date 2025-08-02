/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- ========================================================================
-- GARAADKA LAUNDRY MANAGEMENT SYSTEM - PRODUCTION DATABASE MIGRATION
-- ========================================================================
-- This script creates the complete database structure for production
-- Version: 1.0.0
-- Date: 2024
-- ========================================================================

-- ========================================================================
-- STEP 1: CREATE DATABASE AND SET CHARSET
-- ========================================================================

CREATE DATABASE IF NOT EXISTS `loundary` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `loundary`;

-- ========================================================================
-- STEP 2: CREATE TABLES
-- ========================================================================

-- Table: audit (for tracking changes)
CREATE TABLE IF NOT EXISTS `audit` (
  `audit_id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(100) NOT NULL,
  `record_id` varchar(100) NOT NULL,
  `action` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `changed_by` varchar(100) DEFAULT NULL,
  `changed_at` timestamp DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  PRIMARY KEY (`audit_id`),
  KEY `idx_audit_table_record` (`table_name`,`record_id`),
  KEY `idx_audit_changed_at` (`changed_at`),
  KEY `idx_audit_changed_by` (`changed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: customers
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `registration_date` date DEFAULT curdate(),
  `status` enum('active','inactive') DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `phone_number` (`phone_number`),
  KEY `idx_customers_name` (`customer_name`),
  KEY `idx_customers_phone` (`phone_number`),
  KEY `idx_customers_created_at` (`created_at`),
  KEY `idx_customers_updated_at` (`updated_at`),
  KEY `idx_customers_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: orders
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL UNIQUE,
  `customer_id` int(11) NOT NULL,
  `order_date` date DEFAULT curdate(),
  `due_date` date DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `status` enum('pending','in_progress','ready','delivered','cancelled') DEFAULT 'pending',
  `payment_status` enum('unpaid','partial','paid','refunded') DEFAULT 'unpaid',
  `payment_method` enum('cash','card','mobile','bank_transfer') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `fk_orders_customer` (`customer_id`),
  KEY `idx_orders_order_number` (`order_number`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_updated_at` (`updated_at`),
  KEY `idx_orders_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) GENERATED ALWAYS AS (`quantity` * `unit_price`) STORED,
  `color` varchar(100) DEFAULT NULL,
  `size` varchar(100) DEFAULT NULL,
  `special_instructions` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `idx_order_items_created_at` (`created_at`),
  KEY `idx_order_items_updated_at` (`updated_at`),
  KEY `idx_order_items_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: payments
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `payment_date` date DEFAULT curdate(),
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','card','mobile','bank_transfer') NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payments_order` (`order_id`),
  KEY `idx_payments_created_at` (`created_at`),
  KEY `idx_payments_updated_at` (`updated_at`),
  KEY `idx_payments_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: receipts
CREATE TABLE IF NOT EXISTS `receipts` (
  `receipt_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `receipt_number` varchar(50) NOT NULL UNIQUE,
  `receipt_date` date DEFAULT curdate(),
  `total_amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `final_amount` decimal(10,2) GENERATED ALWAYS AS (`total_amount` + `tax_amount` - `discount_amount`) STORED,
  `receipt_type` enum('order','payment','refund') DEFAULT 'order',
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`receipt_id`),
  KEY `fk_receipts_order` (`order_id`),
  KEY `idx_receipts_receipt_number` (`receipt_number`),
  KEY `idx_receipts_created_at` (`created_at`),
  KEY `idx_receipts_updated_at` (`updated_at`),
  KEY `idx_receipts_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_receipts_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user accounts
CREATE TABLE IF NOT EXISTS `user accounts` (
  `PERSONAL ID` varchar(50) NOT NULL,
  `fname` varchar(255) NOT NULL,
  `USERNAME` varchar(100) NOT NULL UNIQUE,
  `PASSWORD` varchar(255) NOT NULL,
  `CITY` varchar(100) DEFAULT NULL,
  `PHONENO` varchar(20) DEFAULT NULL,
  `POSITION` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`PERSONAL ID`),
  KEY `idx_user_accounts_username` (`USERNAME`),
  KEY `idx_user_accounts_created_at` (`created_at`),
  KEY `idx_user_accounts_updated_at` (`updated_at`),
  KEY `idx_user_accounts_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: register (legacy table for laundry items - CORRECTED STRUCTURE)
CREATE TABLE IF NOT EXISTS `register` (
  `itemNum` int(15) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(100) NOT NULL,
  `descr` varchar(200) NOT NULL,
  `quan` int(30) DEFAULT NULL,
  `unitprice` int(30) DEFAULT NULL,
  `amntword` varchar(100) DEFAULT NULL,
  `duedate` varchar(100) NOT NULL,
  `deliverdate` varchar(100) NOT NULL,
  `totalAmount` int(30) NOT NULL,
  `mobnum` int(20) NOT NULL,
  `payCheck` varchar(50) NOT NULL,
  `col` varchar(100) DEFAULT NULL,
  `siz` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`itemNum`),
  KEY `idx_register_mobnum` (`mobnum`),
  KEY `idx_register_paycheck` (`payCheck`),
  KEY `idx_register_duedate` (`duedate`),
  KEY `idx_register_name` (`NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: app_settings (application configuration)
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL UNIQUE,
  `setting_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`setting_value`)),
  `setting_type` enum('string', 'number', 'boolean', 'json', 'object') DEFAULT 'string',
  `category` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system` boolean DEFAULT FALSE,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`setting_id`),
  KEY `idx_setting_key` (`setting_key`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- STEP 3: INSERT DEFAULT DATA
-- ========================================================================

-- Insert default admin user (Password: admin123 - CHANGE THIS IN PRODUCTION!)
INSERT INTO `user accounts` (`PERSONAL ID`, `fname`, `USERNAME`, `PASSWORD`, `CITY`, `PHONENO`, `POSITION`, `status`) VALUES
('ADMIN001', 'System Administrator', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW', 'Addis Ababa', '+251911000000', 'Administrator', 'active')
ON DUPLICATE KEY UPDATE `USERNAME` = `USERNAME`;

-- Insert default application settings
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_system`) VALUES
('serial_number_config', '{"prefix": "PKG", "randomDigits": 4, "separator": "", "format": "prefix+random"}', 'json', 'serial_numbers', 'Package serial number generation configuration', FALSE),
('order_id_config', '{"prefix": "ORD", "randomDigits": 6, "separator": "-", "format": "prefix+separator+random", "includeDate": false, "dateFormat": "YYYYMMDD"}', 'json', 'order_ids', 'Order ID generation configuration', FALSE),
('business_info', '{"name": "Garaad wil waal Laundry", "address": "", "phone": "", "email": "", "website": "", "taxId": "", "logo": null, "description": "", "workingHours": "Mon-Sat: 8:00 AM - 8:00 PM", "currency": "USD", "timezone": "UTC"}', 'json', 'business', 'Business information and contact details', FALSE),
('invoice_settings', '{"template": "default", "showLogo": true, "showBusinessInfo": true, "showTaxInfo": false, "footerText": "Thank you for your business!", "termsAndConditions": "", "autoGenerate": true, "numberFormat": "INV-{number}", "startingNumber": 1000, "includeQRCode": false}', 'json', 'invoices', 'Invoice generation and formatting settings', FALSE),
('notification_settings', '{"orderNotifications": true, "paymentReminders": true, "lowStockAlerts": false, "customerUpdates": true, "systemMaintenance": true, "emailNotifications": true, "pushNotifications": false, "smsNotifications": false, "autoClose": 5000, "position": "top-right", "sound": true}', 'json', 'notifications', 'Notification preferences and settings', FALSE),
('theme_settings', '{"mode": "light", "primaryColor": "#3b82f6", "fontSize": "medium", "compactMode": false, "sidebarCollapsed": false, "showAnimations": true, "customCSS": ""}', 'json', 'theme', 'Theme and appearance customization', FALSE),
('app_language', '"en"', 'string', 'general', 'Default application language', FALSE),
('app_version', '"1.0.0"', 'string', 'system', 'Application version', TRUE),
('last_backup', 'null', 'string', 'system', 'Last database backup timestamp', TRUE)
ON DUPLICATE KEY UPDATE 
`setting_value` = VALUES(`setting_value`),
`updated_at` = CURRENT_TIMESTAMP;

-- ========================================================================
-- STEP 4: CREATE VIEWS FOR EASIER DATA ACCESS
-- ========================================================================

-- View for order summary with customer info
CREATE OR REPLACE VIEW `order_summary` AS
SELECT 
    o.order_id,
    o.order_number,
    c.customer_name,
    c.phone_number,
    o.order_date,
    o.due_date,
    o.delivery_date,
    o.total_amount,
    o.paid_amount,
    (o.total_amount - IFNULL(o.paid_amount, 0)) AS balance,
    o.status,
    o.payment_status,
    o.payment_method,
    o.notes,
    COUNT(oi.item_id) AS total_items
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id AND oi.deleted_at IS NULL
WHERE o.deleted_at IS NULL AND c.deleted_at IS NULL
GROUP BY o.order_id;

-- View for customer summary
CREATE OR REPLACE VIEW `customer_summary` AS
SELECT 
    c.customer_id,
    c.customer_name,
    c.phone_number,
    c.registration_date,
    c.status,
    COUNT(DISTINCT o.order_id) AS total_orders,
    IFNULL(SUM(o.total_amount), 0) AS total_spent,
    IFNULL(SUM(o.paid_amount), 0) AS total_paid,
    IFNULL(SUM(o.total_amount - IFNULL(o.paid_amount, 0)), 0) AS total_balance,
    MAX(o.order_date) AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.customer_id;

-- ========================================================================
-- STEP 5: CREATE TRIGGERS FOR AUTOMATIC CALCULATIONS
-- ========================================================================

DELIMITER $$

-- Trigger to update order total when order items change
DROP TRIGGER IF EXISTS `update_order_total_after_item_insert`$$
CREATE TRIGGER `update_order_total_after_item_insert` 
AFTER INSERT ON `order_items`
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT IFNULL(SUM(quantity * unit_price), 0) 
        FROM order_items 
        WHERE order_id = NEW.order_id AND deleted_at IS NULL
    )
    WHERE order_id = NEW.order_id;
END$$

DROP TRIGGER IF EXISTS `update_order_total_after_item_update`$$
CREATE TRIGGER `update_order_total_after_item_update` 
AFTER UPDATE ON `order_items`
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT IFNULL(SUM(quantity * unit_price), 0) 
        FROM order_items 
        WHERE order_id = NEW.order_id AND deleted_at IS NULL
    )
    WHERE order_id = NEW.order_id;
END$$

DROP TRIGGER IF EXISTS `update_order_total_after_item_delete`$$
CREATE TRIGGER `update_order_total_after_item_delete` 
AFTER UPDATE ON `order_items`
FOR EACH ROW
BEGIN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE orders 
        SET total_amount = (
            SELECT IFNULL(SUM(quantity * unit_price), 0) 
            FROM order_items 
            WHERE order_id = NEW.order_id AND deleted_at IS NULL
        )
        WHERE order_id = NEW.order_id;
    END IF;
END$$

DELIMITER ;

-- ========================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ========================================================================

-- Additional indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_orders_order_date` ON `orders` (`order_date`);
CREATE INDEX IF NOT EXISTS `idx_orders_due_date` ON `orders` (`due_date`);
CREATE INDEX IF NOT EXISTS `idx_orders_delivery_date` ON `orders` (`delivery_date`);
CREATE INDEX IF NOT EXISTS `idx_payments_payment_date` ON `payments` (`payment_date`);
CREATE INDEX IF NOT EXISTS `idx_payments_reference_number` ON `payments` (`reference_number`);

-- ========================================================================
-- STEP 7: FINAL CLEANUP AND VERIFICATION
-- ========================================================================

-- Reset SQL settings
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;