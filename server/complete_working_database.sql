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
-- GARAADKA LAUNDRY MANAGEMENT SYSTEM - COMPLETE WORKING DATABASE
-- ========================================================================
-- This script creates a complete, working database with all necessary columns
-- Version: 2.0.0
-- Date: 2024
-- ========================================================================

-- ========================================================================
-- STEP 1: CREATE DATABASE AND SET CHARSET
-- ========================================================================

CREATE DATABASE IF NOT EXISTS `gwldb` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `loundary`;

-- ========================================================================
-- STEP 2: CREATE TABLES WITH ALL NECESSARY COLUMNS
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

-- Table: customers (enhanced with all necessary columns)
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `customer_type` enum('regular','vip','corporate') DEFAULT 'regular',
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `credit_limit` decimal(10,2) DEFAULT 0.00,
  `preferences` text DEFAULT NULL,
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
  KEY `idx_customers_email` (`email`),
  KEY `idx_customers_customer_type` (`customer_type`),
  KEY `idx_customers_created_at` (`created_at`),
  KEY `idx_customers_updated_at` (`updated_at`),
  KEY `idx_customers_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: services (for laundry services)
CREATE TABLE IF NOT EXISTS `services` (
  `service_id` int(11) NOT NULL AUTO_INCREMENT,
  `service_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `unit` varchar(50) DEFAULT 'piece',
  `category` varchar(100) DEFAULT NULL,
  `estimated_time` int(11) DEFAULT NULL COMMENT 'Time in hours',
  `is_active` boolean DEFAULT TRUE,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`service_id`),
  KEY `idx_services_name` (`service_name`),
  KEY `idx_services_category` (`category`),
  KEY `idx_services_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: orders (enhanced with all necessary columns)
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL UNIQUE,
  `customer_id` int(11) NOT NULL,
  `order_date` date DEFAULT curdate(),
  `due_date` date DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `final_amount` decimal(10,2) GENERATED ALWAYS AS (`total_amount` - `discount_amount` + `tax_amount`) STORED,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `status` enum('pending','in_progress','ready','delivered','cancelled') DEFAULT 'pending',
  `payment_status` enum('unpaid','partial','paid','refunded') DEFAULT 'unpaid',
  `payment_method` enum('cash','card','mobile','bank_transfer') DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `special_instructions` text DEFAULT NULL,
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
  KEY `idx_orders_order_date` (`order_date`),
  KEY `idx_orders_due_date` (`due_date`),
  KEY `idx_orders_delivery_date` (`delivery_date`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_payment_status` (`payment_status`),
  KEY `idx_orders_priority` (`priority`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_updated_at` (`updated_at`),
  KEY `idx_orders_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: order_items (enhanced)
CREATE TABLE IF NOT EXISTS `order_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `service_id` int(11) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) GENERATED ALWAYS AS (`quantity` * `unit_price`) STORED,
  `color` varchar(100) DEFAULT NULL,
  `size` varchar(100) DEFAULT NULL,
  `condition_before` text DEFAULT NULL,
  `condition_after` text DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `special_instructions` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `fk_order_items_service` (`service_id`),
  KEY `idx_order_items_status` (`status`),
  KEY `idx_order_items_created_at` (`created_at`),
  KEY `idx_order_items_updated_at` (`updated_at`),
  KEY `idx_order_items_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`service_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: payments
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `payment_date` date DEFAULT curdate(),
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','card','mobile','bank_transfer') NOT NULL,
  `payment_type` enum('full','partial','advance','refund') DEFAULT 'partial',
  `reference_number` varchar(100) DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `status` enum('pending','completed','failed','cancelled') DEFAULT 'completed',
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payments_order` (`order_id`),
  KEY `idx_payments_payment_date` (`payment_date`),
  KEY `idx_payments_reference_number` (`reference_number`),
  KEY `idx_payments_transaction_id` (`transaction_id`),
  KEY `idx_payments_status` (`status`),
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
  KEY `idx_receipts_receipt_date` (`receipt_date`),
  KEY `idx_receipts_created_at` (`created_at`),
  KEY `idx_receipts_updated_at` (`updated_at`),
  KEY `idx_receipts_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_receipts_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_accounts (normalized name)
CREATE TABLE IF NOT EXISTS `user_accounts` (
  `user_id` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `role` enum('admin','manager','staff','viewer') DEFAULT 'staff',
  `permissions` text DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_user_accounts_email` (`email`),
  KEY `idx_user_accounts_role` (`role`),
  KEY `idx_user_accounts_status` (`status`),
  KEY `idx_user_accounts_created_at` (`created_at`),
  KEY `idx_user_accounts_updated_at` (`updated_at`),
  KEY `idx_user_accounts_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: register (legacy table for compatibility)
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
INSERT INTO `user_accounts` (`user_id`, `full_name`, `username`, `password`, `email`, `phone_number`, `city`, `position`, `role`, `status`) VALUES
('ADMIN001', 'System Administrator', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW', 'admin@garaadka.com', '+251911000000', 'Addis Ababa', 'Administrator', 'admin', 'active')
ON DUPLICATE KEY UPDATE `username` = `username`;

-- Insert default services
INSERT INTO `services` (`service_name`, `description`, `base_price`, `unit`, `category`, `estimated_time`, `is_active`) VALUES
('Dry Cleaning', 'Professional dry cleaning service', 25.00, 'piece', 'Cleaning', 24, TRUE),
('Washing & Ironing', 'Regular washing and ironing service', 15.00, 'piece', 'Cleaning', 12, TRUE),
('Ironing Only', 'Ironing service only', 8.00, 'piece', 'Pressing', 2, TRUE),
('Stain Removal', 'Specialized stain removal treatment', 35.00, 'piece', 'Treatment', 48, TRUE),
('Alterations', 'Clothing alterations and repairs', 20.00, 'piece', 'Tailoring', 72, TRUE),
('Express Service', 'Same day service (additional charge)', 10.00, 'piece', 'Express', 4, TRUE)
ON DUPLICATE KEY UPDATE `service_name` = `service_name`;

-- Insert sample customers
INSERT INTO `customers` (`customer_name`, `phone_number`, `email`, `address`, `city`, `customer_type`, `registration_date`, `status`) VALUES
('Ahmed Hassan', '+251911123456', 'ahmed@email.com', '123 Main Street', 'Addis Ababa', 'regular', CURDATE(), 'active'),
('Fatima Ali', '+251922234567', 'fatima@email.com', '456 Second Avenue', 'Addis Ababa', 'vip', CURDATE(), 'active'),
('Mohamed Omar', '+251933345678', 'mohamed@email.com', '789 Third Street', 'Addis Ababa', 'corporate', CURDATE(), 'active')
ON DUPLICATE KEY UPDATE `phone_number` = `phone_number`;

-- Insert default application settings
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_system`) VALUES
('serial_number_config', '{"prefix": "PKG", "randomDigits": 4, "separator": "", "format": "prefix+random"}', 'json', 'serial_numbers', 'Package serial number generation configuration', FALSE),
('order_id_config', '{"prefix": "ORD", "randomDigits": 6, "separator": "-", "format": "prefix+separator+random", "includeDate": false, "dateFormat": "YYYYMMDD"}', 'json', 'order_ids', 'Order ID generation configuration', FALSE),
('business_info', '{"name": "Garaad wil waal Laundry", "address": "Addis Ababa, Ethiopia", "phone": "+251911000000", "email": "info@garaadka.com", "website": "www.garaadka.com", "taxId": "", "logo": null, "description": "Professional Laundry Services", "workingHours": "Mon-Sat: 8:00 AM - 8:00 PM", "currency": "ETB", "timezone": "Africa/Addis_Ababa"}', 'json', 'business', 'Business information and contact details', FALSE),
('invoice_settings', '{"template": "default", "showLogo": true, "showBusinessInfo": true, "showTaxInfo": false, "footerText": "Thank you for your business!", "termsAndConditions": "", "autoGenerate": true, "numberFormat": "INV-{number}", "startingNumber": 1000, "includeQRCode": false}', 'json', 'invoices', 'Invoice generation and formatting settings', FALSE),
('notification_settings', '{"orderNotifications": true, "paymentReminders": true, "lowStockAlerts": false, "customerUpdates": true, "systemMaintenance": true, "emailNotifications": true, "pushNotifications": false, "smsNotifications": false, "autoClose": 5000, "position": "top-right", "sound": true}', 'json', 'notifications', 'Notification preferences and settings', FALSE),
('theme_settings', '{"mode": "light", "primaryColor": "#3b82f6", "fontSize": "medium", "compactMode": false, "sidebarCollapsed": false, "showAnimations": true, "customCSS": ""}', 'json', 'theme', 'Theme and appearance customization', FALSE),
('app_language', '"en"', 'string', 'general', 'Default application language', FALSE),
('app_version', '"2.0.0"', 'string', 'system', 'Application version', TRUE),
('last_backup', 'null', 'string', 'system', 'Last database backup timestamp', TRUE)
ON DUPLICATE KEY UPDATE 
`setting_value` = VALUES(`setting_value`),
`updated_at` = CURRENT_TIMESTAMP;

-- ========================================================================
-- STEP 4: CREATE COMPREHENSIVE VIEWS
-- ========================================================================

-- Enhanced order summary view
CREATE OR REPLACE VIEW `order_summary` AS
SELECT 
    o.order_id,
    o.order_number,
    c.customer_name,
    c.phone_number,
    c.email,
    c.customer_type,
    o.order_date,
    o.due_date,
    o.delivery_date,
    o.total_amount,
    o.discount_amount,
    o.tax_amount,
    o.final_amount,
    o.paid_amount,
    (o.final_amount - IFNULL(o.paid_amount, 0)) AS balance_amount,
    o.status,
    o.payment_status,
    o.payment_method,
    o.priority,
    o.special_instructions,
    o.notes,
    COUNT(oi.item_id) AS total_items,
    COUNT(CASE WHEN oi.status = 'completed' THEN 1 END) AS completed_items,
    CASE 
        WHEN COUNT(oi.item_id) = 0 THEN 'No Items'
        WHEN COUNT(CASE WHEN oi.status = 'completed' THEN 1 END) = 0 THEN 'Not Started'
        WHEN COUNT(CASE WHEN oi.status = 'completed' THEN 1 END) = COUNT(oi.item_id) THEN 'Completed'
        ELSE 'In Progress'
    END AS completion_status,
    o.created_at,
    o.updated_at
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id AND oi.deleted_at IS NULL
WHERE o.deleted_at IS NULL AND c.deleted_at IS NULL
GROUP BY o.order_id, o.order_number, c.customer_name, c.phone_number, c.email, c.customer_type, 
         o.order_date, o.due_date, o.delivery_date, o.total_amount, o.discount_amount, o.tax_amount, 
         o.final_amount, o.paid_amount, o.status, o.payment_status, o.payment_method, o.priority, 
         o.special_instructions, o.notes, o.created_at, o.updated_at;

-- Enhanced customer summary view
CREATE OR REPLACE VIEW `customer_summary` AS
SELECT 
    c.customer_id,
    c.customer_name,
    c.phone_number,
    c.email,
    c.address,
    c.city,
    c.customer_type,
    c.discount_percentage,
    c.credit_limit,
    c.registration_date,
    c.status,
    COUNT(DISTINCT o.order_id) AS total_orders,
    IFNULL(SUM(o.final_amount), 0) AS total_spent,
    IFNULL(SUM(o.paid_amount), 0) AS total_paid,
    IFNULL(SUM(o.final_amount - IFNULL(o.paid_amount, 0)), 0) AS total_balance,
    MAX(o.order_date) AS last_order_date,
    MIN(o.order_date) AS first_order_date,
    CASE 
        WHEN COUNT(DISTINCT o.order_id) > 0 
        THEN AVG(o.final_amount) 
        ELSE 0 
    END AS average_order_value,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders,
    c.created_at,
    c.updated_at
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.customer_id, c.customer_name, c.phone_number, c.email, c.address, c.city, 
         c.customer_type, c.discount_percentage, c.credit_limit, c.registration_date, 
         c.status, c.created_at, c.updated_at;

-- Enhanced payment summary view
CREATE OR REPLACE VIEW `payment_summary` AS
SELECT 
    p.payment_id,
    p.order_id,
    o.order_number,
    c.customer_name,
    c.phone_number,
    c.email,
    p.payment_date,
    p.amount,
    p.payment_method,
    p.payment_type,
    p.reference_number,
    p.transaction_id,
    p.status,
    IFNULL(ua.full_name, 'System') AS processed_by,
    p.notes,
    p.created_at
FROM payments p
LEFT JOIN orders o ON p.order_id = o.order_id
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN user_accounts ua ON p.created_by = ua.user_id
WHERE p.deleted_at IS NULL;

-- Daily sales summary view
CREATE OR REPLACE VIEW `daily_sales_summary` AS
SELECT 
    DATE(o.order_date) AS sale_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(o.total_amount) AS total_revenue,
    SUM(o.discount_amount) AS total_discounts,
    SUM(o.tax_amount) AS total_tax,
    SUM(o.final_amount) AS total_final_amount,
    SUM(o.paid_amount) AS total_collected,
    SUM(o.final_amount - IFNULL(o.paid_amount, 0)) AS total_outstanding,
    CASE 
        WHEN COUNT(DISTINCT o.order_id) > 0 
        THEN AVG(o.final_amount) 
        ELSE 0 
    END AS average_order_value,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN o.status = 'in_progress' THEN 1 END) AS in_progress_orders,
    COUNT(CASE WHEN o.status = 'ready' THEN 1 END) AS ready_orders
FROM orders o
WHERE o.deleted_at IS NULL
GROUP BY DATE(o.order_date)
ORDER BY sale_date DESC;

-- Service performance view
CREATE OR REPLACE VIEW `service_performance` AS
SELECT 
    s.service_id,
    s.service_name,
    s.category,
    s.base_price,
    COUNT(oi.item_id) AS times_ordered,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.total_price) AS total_revenue,
    AVG(oi.unit_price) AS average_price,
    COUNT(CASE WHEN oi.status = 'completed' THEN 1 END) AS completed_items,
    COUNT(CASE WHEN oi.status = 'cancelled' THEN 1 END) AS cancelled_items,
    s.estimated_time,
    s.is_active
FROM services s
LEFT JOIN order_items oi ON s.service_id = oi.service_id AND oi.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.service_id, s.service_name, s.category, s.base_price, s.estimated_time, s.is_active
ORDER BY total_revenue DESC;

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

-- Trigger to update payment status when payments change
DROP TRIGGER IF EXISTS `update_payment_status_after_payment_insert`$$
CREATE TRIGGER `update_payment_status_after_payment_insert` 
AFTER INSERT ON `payments`
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2);
    DECLARE order_total DECIMAL(10,2);
    
    SELECT IFNULL(SUM(amount), 0) INTO total_paid 
    FROM payments 
    WHERE order_id = NEW.order_id AND deleted_at IS NULL;
    
    SELECT final_amount INTO order_total 
    FROM orders 
    WHERE order_id = NEW.order_id;
    
    UPDATE orders 
    SET 
        paid_amount = total_paid,
        payment_status = CASE 
            WHEN total_paid = 0 THEN 'unpaid'
            WHEN total_paid >= order_total THEN 'paid'
            ELSE 'partial'
        END
    WHERE order_id = NEW.order_id;
END$$

-- Trigger to auto-generate order numbers
DROP TRIGGER IF EXISTS `generate_order_number`$$
CREATE TRIGGER `generate_order_number` 
BEFORE INSERT ON `orders`
FOR EACH ROW
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SET NEW.order_number = CONCAT('ORD-', LPAD(NEW.order_id, 6, '0'));
    END IF;
END$$

-- Trigger to auto-generate receipt numbers
DROP TRIGGER IF EXISTS `generate_receipt_number`$$
CREATE TRIGGER `generate_receipt_number` 
BEFORE INSERT ON `receipts`
FOR EACH ROW
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        SET NEW.receipt_number = CONCAT('RCP-', LPAD(NEW.receipt_id, 6, '0'));
    END IF;
END$$

DELIMITER ;

-- ========================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ========================================================================

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS `idx_orders_customer_date` ON `orders` (`customer_id`, `order_date`);
CREATE INDEX IF NOT EXISTS `idx_order_items_order_status` ON `order_items` (`order_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_payments_order_date` ON `payments` (`order_id`, `payment_date`);
CREATE INDEX IF NOT EXISTS `idx_customers_type_status` ON `customers` (`customer_type`, `status`);
CREATE INDEX IF NOT EXISTS `idx_services_category_active` ON `services` (`category`, `is_active`);

-- ========================================================================
-- STEP 7: RESET AUTO_INCREMENT VALUES
-- ========================================================================

ALTER TABLE `customers` AUTO_INCREMENT = 1000;
ALTER TABLE `orders` AUTO_INCREMENT = 1000;
ALTER TABLE `order_items` AUTO_INCREMENT = 1000;
ALTER TABLE `payments` AUTO_INCREMENT = 1000;
ALTER TABLE `receipts` AUTO_INCREMENT = 1000;
ALTER TABLE `services` AUTO_INCREMENT = 100;
ALTER TABLE `app_settings` AUTO_INCREMENT = 100;
ALTER TABLE `audit` AUTO_INCREMENT = 1;

-- ========================================================================
-- STEP 8: FINAL VERIFICATION
-- ========================================================================

-- Test all views
SELECT 'Database setup completed successfully!' AS status;
SELECT 'Testing views...' AS test;

SELECT COUNT(*) AS order_summary_count FROM order_summary;
SELECT COUNT(*) AS customer_summary_count FROM customer_summary;
SELECT COUNT(*) AS payment_summary_count FROM payment_summary;
SELECT COUNT(*) AS daily_sales_summary_count FROM daily_sales_summary;
SELECT COUNT(*) AS service_performance_count FROM service_performance;

-- Show table counts
SELECT 
    'customers' AS table_name, COUNT(*) AS record_count FROM customers
UNION ALL
SELECT 
    'services' AS table_name, COUNT(*) AS record_count FROM services
UNION ALL
SELECT 
    'user_accounts' AS table_name, COUNT(*) AS record_count FROM user_accounts
UNION ALL
SELECT 
    'app_settings' AS table_name, COUNT(*) AS record_count FROM app_settings;

SELECT 'All views are working! Database is ready for production use.' AS final_status;

-- ========================================================================
-- STEP 9: FINAL CLEANUP
-- ========================================================================

-- Reset SQL settings
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;