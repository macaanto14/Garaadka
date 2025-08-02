-- ========================================================================
-- GARAADKA LAUNDRY MANAGEMENT SYSTEM - COMPLETE PRODUCTION DATABASE
-- ========================================================================
-- Version: 2.0.0
-- Date: 2024
-- Description: Complete production-ready database with all tables, 
--              indexes, triggers, views, and initial data
-- ========================================================================

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
-- STEP 1: CREATE DATABASE
-- ========================================================================

CREATE DATABASE IF NOT EXISTS `gwldb` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `gwldb`;

-- ========================================================================
-- STEP 2: CREATE CORE TABLES
-- ========================================================================

-- Table: app_settings (Application Configuration)
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL UNIQUE,
  `setting_value` longtext NOT NULL,
  `setting_type` enum('string','number','boolean','json','object') DEFAULT 'string',
  `category` varchar(50) DEFAULT 'general',
  `description` text DEFAULT NULL,
  `is_system` boolean DEFAULT FALSE,
  `is_encrypted` boolean DEFAULT FALSE,
  `validation_rules` json DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT 'system',
  `updated_by` varchar(100) DEFAULT 'system',
  PRIMARY KEY (`setting_id`),
  KEY `idx_app_settings_key` (`setting_key`),
  KEY `idx_app_settings_category` (`category`),
  KEY `idx_app_settings_type` (`setting_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit (System Audit Trail)
CREATE TABLE IF NOT EXISTS `audit` (
  `audit_id` int(11) NOT NULL AUTO_INCREMENT,
  `emp_id` varchar(100) NOT NULL,
  `date` varchar(100) NOT NULL,
  `status` varchar(80) NOT NULL,
  `action_type` enum('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','VIEW','EXPORT') DEFAULT 'CREATE',
  `table_name` varchar(50) DEFAULT NULL,
  `record_id` varchar(100) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  PRIMARY KEY (`audit_id`),
  KEY `idx_audit_emp_id` (`emp_id`),
  KEY `idx_audit_table_name` (`table_name`),
  KEY `idx_audit_action_type` (`action_type`),
  KEY `idx_audit_created_at` (`created_at`),
  KEY `idx_audit_record_id` (`record_id`),
  KEY `idx_audit_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: customers
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `registration_date` date DEFAULT curdate(),
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `status` enum('active','inactive','blocked') DEFAULT 'active',
  `customer_type` enum('regular','vip','corporate') DEFAULT 'regular',
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `credit_limit` decimal(10,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `phone_number` (`phone_number`),
  KEY `idx_customers_name` (`customer_name`),
  KEY `idx_customers_email` (`email`),
  KEY `idx_customers_status` (`status`),
  KEY `idx_customers_type` (`customer_type`),
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
  `pickup_date` date DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `final_amount` decimal(10,2) GENERATED ALWAYS AS (`total_amount` - `discount_amount` + `tax_amount`) STORED,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `balance_amount` decimal(10,2) GENERATED ALWAYS AS (`final_amount` - `paid_amount`) STORED,
  `status` enum('pending','confirmed','in_progress','ready','delivered','cancelled','refunded') DEFAULT 'pending',
  `payment_status` enum('unpaid','partial','paid','overpaid','refunded') DEFAULT 'unpaid',
  `payment_method` enum('cash','card','mobile','bank_transfer','credit') DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `special_instructions` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `estimated_completion_time` int DEFAULT NULL COMMENT 'Hours',
  `actual_completion_time` int DEFAULT NULL COMMENT 'Hours',
  `quality_check_status` enum('pending','passed','failed','rework') DEFAULT 'pending',
  `quality_check_notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `fk_orders_customer` (`customer_id`),
  KEY `idx_orders_order_number` (`order_number`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_payment_status` (`payment_status`),
  KEY `idx_orders_priority` (`priority`),
  KEY `idx_orders_due_date` (`due_date`),
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
  `item_category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) GENERATED ALWAYS AS (`quantity` * `unit_price` * `discount_percentage` / 100) STORED,
  `subtotal` decimal(10,2) GENERATED ALWAYS AS (`quantity` * `unit_price` - `discount_amount`) STORED,
  `color` varchar(100) DEFAULT NULL,
  `size` varchar(100) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `fabric_type` varchar(100) DEFAULT NULL,
  `care_instructions` text DEFAULT NULL,
  `special_instructions` text DEFAULT NULL,
  `condition_before` enum('excellent','good','fair','poor','damaged') DEFAULT 'good',
  `condition_after` enum('excellent','good','fair','poor','damaged') DEFAULT NULL,
  `status` enum('pending','in_progress','completed','quality_check','ready','delivered','cancelled') DEFAULT 'pending',
  `assigned_to` varchar(100) DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `images` json DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `idx_order_items_status` (`status`),
  KEY `idx_order_items_category` (`item_category`),
  KEY `idx_order_items_assigned` (`assigned_to`),
  KEY `idx_order_items_created_at` (`created_at`),
  KEY `idx_order_items_updated_at` (`updated_at`),
  KEY `idx_order_items_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: payments
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `payment_date` datetime DEFAULT current_timestamp(),
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','card','mobile','bank_transfer','check','credit') NOT NULL,
  `payment_type` enum('full','partial','advance','refund') DEFAULT 'partial',
  `reference_number` varchar(100) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','completed','failed','cancelled','refunded') DEFAULT 'pending',
  `gateway_response` json DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `processed_by` varchar(100) DEFAULT NULL,
  `verified_by` varchar(100) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payments_customer` (`customer_id`),
  KEY `fk_payments_order` (`order_id`),
  KEY `idx_payments_method` (`payment_method`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_reference` (`reference_number`),
  KEY `idx_payments_created_at` (`created_at`),
  KEY `idx_payments_updated_at` (`updated_at`),
  KEY `idx_payments_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_payments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: receipts
CREATE TABLE IF NOT EXISTS `receipts` (
  `receipt_id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_number` varchar(50) NOT NULL UNIQUE,
  `order_id` int(11) DEFAULT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `receipt_date` datetime DEFAULT current_timestamp(),
  `receipt_type` enum('order','payment','refund','credit_note') DEFAULT 'order',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) GENERATED ALWAYS AS (`subtotal` - `discount_amount` + `tax_amount`) STORED,
  `currency` varchar(3) DEFAULT 'USD',
  `exchange_rate` decimal(10,4) DEFAULT 1.0000,
  `status` enum('draft','issued','sent','paid','cancelled','refunded') DEFAULT 'issued',
  `due_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `terms_conditions` text DEFAULT NULL,
  `footer_text` text DEFAULT NULL,
  `template_used` varchar(100) DEFAULT 'default',
  `pdf_path` varchar(500) DEFAULT NULL,
  `email_sent` boolean DEFAULT FALSE,
  `email_sent_at` timestamp NULL DEFAULT NULL,
  `print_count` int DEFAULT 0,
  `last_printed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`receipt_id`),
  KEY `fk_receipts_order` (`order_id`),
  KEY `fk_receipts_payment` (`payment_id`),
  KEY `fk_receipts_customer` (`customer_id`),
  KEY `idx_receipts_number` (`receipt_number`),
  KEY `idx_receipts_type` (`receipt_type`),
  KEY `idx_receipts_status` (`status`),
  KEY `idx_receipts_created_at` (`created_at`),
  KEY `idx_receipts_updated_at` (`updated_at`),
  KEY `idx_receipts_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_receipts_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_receipts_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_receipts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user accounts (Legacy compatibility)
CREATE TABLE IF NOT EXISTS `user accounts` (
  `PERSONAL ID` varchar(50) NOT NULL,
  `fname` varchar(255) NOT NULL,
  `lname` varchar(255) DEFAULT NULL,
  `USERNAME` varchar(100) NOT NULL UNIQUE,
  `PASSWORD` varchar(255) NOT NULL,
  `EMAIL` varchar(255) DEFAULT NULL,
  `CITY` varchar(100) DEFAULT NULL,
  `PHONENO` varchar(20) DEFAULT NULL,
  `POSITION` varchar(100) DEFAULT NULL,
  `DEPARTMENT` varchar(100) DEFAULT NULL,
  `ROLE` enum('admin','manager','staff','viewer') DEFAULT 'staff',
  `PERMISSIONS` json DEFAULT NULL,
  `sec_que` varchar(255) DEFAULT NULL,
  `answer` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','suspended','locked') DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `login_attempts` int DEFAULT 0,
  `password_changed_at` timestamp NULL DEFAULT NULL,
  `password_expires_at` timestamp NULL DEFAULT NULL,
  `two_factor_enabled` boolean DEFAULT FALSE,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`PERSONAL ID`),
  KEY `idx_user_accounts_username` (`USERNAME`),
  KEY `idx_user_accounts_email` (`EMAIL`),
  KEY `idx_user_accounts_role` (`ROLE`),
  KEY `idx_user_accounts_status` (`status`),
  KEY `idx_user_accounts_created_at` (`created_at`),
  KEY `idx_user_accounts_updated_at` (`updated_at`),
  KEY `idx_user_accounts_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: register (Legacy laundry items table)
CREATE TABLE IF NOT EXISTS `register` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `itemNum` varchar(50) DEFAULT NULL,
  `NAME` varchar(255) NOT NULL,
  `descr` text DEFAULT NULL,
  `quan` int(11) DEFAULT 1,
  `unitprice` decimal(10,2) DEFAULT 0.00,
  `amntword` varchar(255) DEFAULT NULL,
  `duedate` date DEFAULT NULL,
  `deliverdate` date DEFAULT NULL,
  `totalAmount` decimal(10,2) DEFAULT 0.00,
  `mobnum` varchar(20) DEFAULT NULL,
  `payCheck` enum('paid','unpaid','partial') DEFAULT 'unpaid',
  `col` varchar(100) DEFAULT NULL,
  `siz` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','inactive','completed') DEFAULT 'active',
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_register_itemnum` (`itemNum`),
  KEY `idx_register_name` (`NAME`),
  KEY `idx_register_mobnum` (`mobnum`),
  KEY `idx_register_paycheck` (`payCheck`),
  KEY `idx_register_status` (`status`),
  KEY `idx_register_created_at` (`created_at`),
  KEY `idx_register_updated_at` (`updated_at`),
  KEY `idx_register_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: services (Service catalog)
CREATE TABLE IF NOT EXISTS `services` (
  `service_id` int(11) NOT NULL AUTO_INCREMENT,
  `service_name` varchar(255) NOT NULL,
  `service_code` varchar(50) UNIQUE DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit` enum('piece','kg','hour','service') DEFAULT 'piece',
  `estimated_time` int DEFAULT NULL COMMENT 'Minutes',
  `is_active` boolean DEFAULT TRUE,
  `requires_special_handling` boolean DEFAULT FALSE,
  `special_instructions` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`service_id`),
  KEY `idx_services_name` (`service_name`),
  KEY `idx_services_code` (`service_code`),
  KEY `idx_services_category` (`category`),
  KEY `idx_services_active` (`is_active`),
  KEY `idx_services_created_at` (`created_at`),
  KEY `idx_services_updated_at` (`updated_at`),
  KEY `idx_services_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- STEP 3: CREATE VIEWS FOR REPORTING
-- ========================================================================

-- View: order_summary
CREATE OR REPLACE VIEW `order_summary` AS
SELECT 
    o.order_id,
    o.order_number,
    c.customer_name,
    c.phone_number,
    c.customer_type,
    o.order_date,
    o.due_date,
    o.delivery_date,
    o.total_amount,
    o.discount_amount,
    o.tax_amount,
    o.final_amount,
    o.paid_amount,
    o.balance_amount,
    o.status,
    o.payment_status,
    o.payment_method,
    o.priority,
    o.notes,
    COUNT(oi.item_id) AS total_items,
    SUM(CASE WHEN oi.status = 'completed' THEN 1 ELSE 0 END) AS completed_items,
    CASE 
        WHEN COUNT(oi.item_id) = SUM(CASE WHEN oi.status = 'completed' THEN 1 ELSE 0 END) 
        THEN 'All Complete'
        WHEN SUM(CASE WHEN oi.status = 'completed' THEN 1 ELSE 0 END) > 0 
        THEN 'Partially Complete'
        ELSE 'Not Started'
    END AS completion_status,
    o.created_at,
    o.updated_at
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id AND oi.deleted_at IS NULL
WHERE o.deleted_at IS NULL AND c.deleted_at IS NULL
GROUP BY o.order_id;

-- View: customer_summary
CREATE OR REPLACE VIEW `customer_summary` AS
SELECT 
    c.customer_id,
    c.customer_name,
    c.phone_number,
    c.email,
    c.customer_type,
    c.registration_date,
    c.status,
    COUNT(DISTINCT o.order_id) AS total_orders,
    IFNULL(SUM(o.final_amount), 0) AS total_spent,
    IFNULL(SUM(o.paid_amount), 0) AS total_paid,
    IFNULL(SUM(o.balance_amount), 0) AS total_balance,
    MAX(o.order_date) AS last_order_date,
    MIN(o.order_date) AS first_order_date,
    AVG(o.final_amount) AS average_order_value,
    COUNT(CASE WHEN o.status = 'completed' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders,
    c.created_at,
    c.updated_at
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.customer_id;

-- View: payment_summary
CREATE OR REPLACE VIEW `payment_summary` AS
SELECT 
    p.payment_id,
    p.order_id,
    o.order_number,
    c.customer_name,
    c.phone_number,
    p.payment_date,
    p.amount,
    p.payment_method,
    p.payment_type,
    p.reference_number,
    p.status,
    p.processed_by,
    p.created_at
FROM payments p
LEFT JOIN orders o ON p.order_id = o.order_id
LEFT JOIN customers c ON p.customer_id = c.customer_id
WHERE p.deleted_at IS NULL;

-- View: daily_sales_summary
CREATE OR REPLACE VIEW `daily_sales_summary` AS
SELECT 
    DATE(o.order_date) AS sale_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(o.final_amount) AS total_revenue,
    SUM(o.paid_amount) AS total_collected,
    SUM(o.balance_amount) AS total_outstanding,
    AVG(o.final_amount) AS average_order_value,
    COUNT(CASE WHEN o.status = 'completed' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders
FROM orders o
WHERE o.deleted_at IS NULL
GROUP BY DATE(o.order_date)
ORDER BY sale_date DESC;

-- ========================================================================
-- STEP 4: CREATE TRIGGERS
-- ========================================================================

DELIMITER $$

-- Trigger: Update order totals when items change
CREATE TRIGGER `update_order_totals_after_item_insert` 
AFTER INSERT ON `order_items`
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT IFNULL(SUM(subtotal), 0) 
        FROM order_items 
        WHERE order_id = NEW.order_id AND deleted_at IS NULL
    )
    WHERE order_id = NEW.order_id;
END$$

CREATE TRIGGER `update_order_totals_after_item_update` 
AFTER UPDATE ON `order_items`
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT IFNULL(SUM(subtotal), 0) 
        FROM order_items 
        WHERE order_id = NEW.order_id AND deleted_at IS NULL
    )
    WHERE order_id = NEW.order_id;
END$$

-- Trigger: Update order payment status when payments change
CREATE TRIGGER `update_order_payment_status_after_payment_insert` 
AFTER INSERT ON `payments`
FOR EACH ROW
BEGIN
    DECLARE order_total DECIMAL(10,2);
    DECLARE total_paid DECIMAL(10,2);
    
    IF NEW.order_id IS NOT NULL THEN
        SELECT final_amount INTO order_total 
        FROM orders 
        WHERE order_id = NEW.order_id;
        
        SELECT IFNULL(SUM(amount), 0) INTO total_paid
        FROM payments 
        WHERE order_id = NEW.order_id 
        AND status = 'completed' 
        AND deleted_at IS NULL;
        
        UPDATE orders 
        SET 
            paid_amount = total_paid,
            payment_status = CASE 
                WHEN total_paid = 0 THEN 'unpaid'
                WHEN total_paid >= order_total THEN 'paid'
                WHEN total_paid > order_total THEN 'overpaid'
                ELSE 'partial'
            END
        WHERE order_id = NEW.order_id;
    END IF;
END$$

-- Trigger: Auto-generate order numbers
CREATE TRIGGER `generate_order_number_before_insert` 
BEFORE INSERT ON `orders`
FOR EACH ROW
BEGIN
    DECLARE next_number INT;
    DECLARE order_prefix VARCHAR(10) DEFAULT 'ORD';
    
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(order_number, 4) AS UNSIGNED)), 0) + 1 
        INTO next_number
        FROM orders 
        WHERE order_number REGEXP '^ORD[0-9]+$';
        
        SET NEW.order_number = CONCAT(order_prefix, LPAD(next_number, 6, '0'));
    END IF;
END$$

-- Trigger: Auto-generate receipt numbers
CREATE TRIGGER `generate_receipt_number_before_insert` 
BEFORE INSERT ON `receipts`
FOR EACH ROW
BEGIN
    DECLARE next_number INT;
    DECLARE receipt_prefix VARCHAR(10) DEFAULT 'RCP';
    
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(receipt_number, 4) AS UNSIGNED)), 0) + 1 
        INTO next_number
        FROM receipts 
        WHERE receipt_number REGEXP '^RCP[0-9]+$';
        
        SET NEW.receipt_number = CONCAT(receipt_prefix, LPAD(next_number, 6, '0'));
    END IF;
END$$

DELIMITER ;

-- ========================================================================
-- STEP 5: INSERT INITIAL DATA
-- ========================================================================

-- Insert app settings
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_system`) VALUES
('serial_number_config', '{"prefix": "PKG", "randomDigits": 4, "separator": "", "format": "prefix+random"}', 'json', 'serial_numbers', 'Package serial number generation configuration', FALSE),
('order_id_config', '{"prefix": "ORD", "randomDigits": 6, "separator": "-", "format": "prefix+separator+random", "includeDate": false, "dateFormat": "YYYYMMDD"}', 'json', 'order_ids', 'Order ID generation configuration', FALSE),
('business_info', '{"name": "Garaad wil waal Laundry", "address": "Addis Ababa, Ethiopia", "phone": "+251911000000", "email": "info@garaadka.com", "website": "www.garaadka.com", "taxId": "", "logo": null, "description": "Professional Laundry Services", "workingHours": "Mon-Sat: 8:00 AM - 8:00 PM", "currency": "ETB", "timezone": "Africa/Addis_Ababa"}', 'json', 'business', 'Business information and contact details', FALSE),
('invoice_settings', '{"template": "default", "showLogo": true, "showBusinessInfo": true, "showTaxInfo": false, "footerText": "Thank you for your business!", "termsAndConditions": "", "autoGenerate": true, "numberFormat": "INV-{number}", "startingNumber": 1000, "includeQRCode": false}', 'json', 'invoices', 'Invoice generation and formatting settings', FALSE),
('notification_settings', '{"orderNotifications": true, "paymentReminders": true, "lowStockAlerts": false, "customerUpdates": true, "systemMaintenance": true, "emailNotifications": true, "pushNotifications": false, "smsNotifications": false, "autoClose": 5000, "position": "top-right", "sound": true}', 'json', 'notifications', 'Notification preferences and settings', FALSE),
('theme_settings', '{"mode": "light", "primaryColor": "#3b82f6", "fontSize": "medium", "compactMode": false, "sidebarCollapsed": false, "showAnimations": true, "customCSS": ""}', 'json', 'theme', 'Theme and appearance customization', FALSE),
('app_language', '"en"', 'string', 'general', 'Default application language', FALSE),
('app_version', '"2.0.0"', 'string', 'system', 'Application version', TRUE),
('last_backup', 'null', 'string', 'system', 'Last database backup timestamp', TRUE),
('maintenance_mode', 'false', 'boolean', 'system', 'Application maintenance mode', TRUE),
('max_file_upload_size', '10485760', 'number', 'system', 'Maximum file upload size in bytes (10MB)', FALSE),
('session_timeout', '3600', 'number', 'security', 'Session timeout in seconds', FALSE),
('password_policy', '{"minLength": 8, "requireUppercase": true, "requireLowercase": true, "requireNumbers": true, "requireSpecialChars": false, "maxAge": 90}', 'json', 'security', 'Password policy configuration', FALSE)
ON DUPLICATE KEY UPDATE 
`setting_value` = VALUES(`setting_value`),
`updated_at` = CURRENT_TIMESTAMP;

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO `user accounts` (`PERSONAL ID`, `fname`, `USERNAME`, `PASSWORD`, `CITY`, `PHONENO`, `POSITION`, `ROLE`, `status`) VALUES
('ADMIN001', 'System Administrator', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW', 'Addis Ababa', '+251911000000', 'Administrator', 'admin', 'active')
ON DUPLICATE KEY UPDATE 
`PASSWORD` = VALUES(`PASSWORD`),
`updated_at` = CURRENT_TIMESTAMP;

-- Insert default services
INSERT INTO `services` (`service_name`, `service_code`, `category`, `description`, `base_price`, `unit`, `estimated_time`, `is_active`) VALUES
('Dry Cleaning - Shirt', 'DC_SHIRT', 'Dry Cleaning', 'Professional dry cleaning for shirts', 25.00, 'piece', 1440, TRUE),
('Dry Cleaning - Pants', 'DC_PANTS', 'Dry Cleaning', 'Professional dry cleaning for pants', 30.00, 'piece', 1440, TRUE),
('Dry Cleaning - Suit', 'DC_SUIT', 'Dry Cleaning', 'Professional dry cleaning for suits', 80.00, 'piece', 2880, TRUE),
('Dry Cleaning - Dress', 'DC_DRESS', 'Dry Cleaning', 'Professional dry cleaning for dresses', 45.00, 'piece', 1440, TRUE),
('Wash & Fold', 'WF_REGULAR', 'Wash & Fold', 'Regular wash and fold service', 15.00, 'kg', 720, TRUE),
('Wash & Iron', 'WI_REGULAR', 'Wash & Iron', 'Wash and iron service', 20.00, 'kg', 1440, TRUE),
('Iron Only', 'IO_REGULAR', 'Ironing', 'Ironing service only', 10.00, 'piece', 30, TRUE),
('Stain Removal', 'SR_SPECIAL', 'Special Services', 'Special stain removal treatment', 35.00, 'piece', 2880, TRUE),
('Alterations', 'ALT_BASIC', 'Alterations', 'Basic clothing alterations', 50.00, 'service', 4320, TRUE),
('Express Service', 'EXP_SERVICE', 'Express', 'Same day express service (50% surcharge)', 0.00, 'service', 480, TRUE)
ON DUPLICATE KEY UPDATE 
`base_price` = VALUES(`base_price`),
`updated_at` = CURRENT_TIMESTAMP;

-- Insert sample customer (optional)
INSERT INTO `customers` (`customer_name`, `phone_number`, `email`, `address`, `customer_type`, `status`) VALUES
('John Doe', '+251911123456', 'john.doe@example.com', '123 Main Street, Addis Ababa', 'regular', 'active')
ON DUPLICATE KEY UPDATE 
`customer_name` = VALUES(`customer_name`);

-- ========================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- ========================================================================

-- Additional performance indexes
CREATE INDEX `idx_orders_date_status` ON `orders` (`order_date`, `status`);
CREATE INDEX `idx_payments_date_method` ON `payments` (`payment_date`, `payment_method`);
CREATE INDEX `idx_order_items_order_status` ON `order_items` (`order_id`, `status`);
CREATE INDEX `idx_customers_type_status` ON `customers` (`customer_type`, `status`);
CREATE INDEX `idx_audit_date_action` ON `audit` (`date`, `action_type`);

-- ========================================================================
-- STEP 7: FINAL CLEANUP AND OPTIMIZATION
-- ========================================================================

-- Analyze tables for better performance
ANALYZE TABLE `customers`, `orders`, `order_items`, `payments`, `receipts`, `audit`, `app_settings`, `services`;

-- Reset auto increment values
ALTER TABLE `customers` AUTO_INCREMENT = 1000;
ALTER TABLE `orders` AUTO_INCREMENT = 1000;
ALTER TABLE `order_items` AUTO_INCREMENT = 1000;
ALTER TABLE `payments` AUTO_INCREMENT = 1000;
ALTER TABLE `receipts` AUTO_INCREMENT = 1000;
ALTER TABLE `audit` AUTO_INCREMENT = 1;
ALTER TABLE `services` AUTO_INCREMENT = 1;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- ========================================================================
-- DEPLOYMENT COMPLETE
-- ========================================================================

SELECT 'Production database setup completed successfully!' AS Status;
SELECT COUNT(*) AS 'Total Tables' FROM information_schema.tables WHERE table_schema = 'gwldb';
SELECT COUNT(*) AS 'Total Views' FROM information_schema.views WHERE table_schema = 'gwldb';
SELECT COUNT(*) AS 'Total Triggers' FROM information_schema.triggers WHERE trigger_schema = 'gwldb';