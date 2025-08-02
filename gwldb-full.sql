-- --------------------------------------------------------
-- Host:                         47.236.39.181
-- Server version:               10.5.27-MariaDB - MariaDB Server
-- Server OS:                    Linux
-- HeidiSQL Version:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for gwldb
CREATE DATABASE IF NOT EXISTS `gwldb` /*!40100 DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci */;
USE `gwldb`;

-- Dumping structure for table gwldb.app_settings
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`setting_value`)),
  `setting_type` enum('string','number','boolean','json','object') DEFAULT 'string',
  `category` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_setting_key` (`setting_key`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.app_settings: ~9 rows (approximately)
INSERT INTO `app_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_system`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
	(1, 'serial_number_config', '{"prefix": "PKG", "randomDigits": 4, "separator": "", "format": "prefix+random"}', 'json', 'serial_numbers', 'Package serial number generation configuration', 0, '2025-08-02 18:04:11', '2025-08-02 18:04:11', NULL, NULL),
	(2, 'order_id_config', '{"prefix": "ORD", "randomDigits": 6, "separator": "-", "format": "prefix+separator+random", "includeDate": false, "dateFormat": "YYYYMMDD"}', 'json', 'order_ids', 'Order ID generation configuration', 0, '2025-08-02 18:04:11', '2025-08-02 18:04:11', NULL, NULL),
	(3, 'business_info', '{"name": "Garaad wil waal Laundry", "address": "", "phone": "", "email": "", "website": "", "taxId": "", "logo": null, "description": "", "workingHours": "Mon-Sat: 8:00 AM - 8:00 PM", "currency": "USD", "timezone": "UTC"}', 'json', 'business', 'Business information and contact details', 0, '2025-08-02 18:04:11', '2025-08-02 18:04:11', NULL, NULL),
	(4, 'invoice_settings', '{"template": "default", "showLogo": true, "showBusinessInfo": true, "showTaxInfo": false, "footerText": "Thank you for your business!", "termsAndConditions": "", "autoGenerate": true, "numberFormat": "INV-{number}", "startingNumber": 1000, "includeQRCode": false}', 'json', 'invoices', 'Invoice generation and formatting settings', 0, '2025-08-02 18:04:11', '2025-08-02 18:04:11', NULL, NULL),
	(5, 'notification_settings', '{"orderNotifications": true, "paymentReminders": true, "lowStockAlerts": false, "customerUpdates": true, "systemMaintenance": true, "emailNotifications": true, "pushNotifications": false, "smsNotifications": false, "autoClose": 5000, "position": "top-right", "sound": true}', 'json', 'notifications', 'Notification preferences and settings', 0, '2025-08-02 18:04:11', '2025-08-02 18:04:11', NULL, NULL),
	(6, 'theme_settings', '{"mode": "light", "primaryColor": "#3b82f6", "fontSize": "medium", "compactMode": false, "sidebarCollapsed": false, "showAnimations": true, "customCSS": ""}', 'json', 'theme', 'Theme and appearance customization', 0, '2025-08-02 18:04:11', '2025-08-02 18:04:11', NULL, NULL),
	(7, 'app_language', '"en"', 'string', 'general', 'Default application language', 0, '2025-08-02 18:04:11', '2025-08-02 18:04:11', NULL, NULL),
	(8, 'app_version', '"1.0.0"', 'string', 'system', 'Application version', 1, '2025-08-02 18:04:11', '2025-08-02 18:04:11', NULL, NULL),
	(9, 'last_backup', 'null', 'string', 'system', 'Last database backup timestamp', 1, '2025-08-02 18:04:11', '2025-08-02 18:04:11', NULL, NULL);

-- Dumping structure for table gwldb.audit
CREATE TABLE IF NOT EXISTS `audit` (
  `audit_id` int(30) NOT NULL AUTO_INCREMENT,
  `emp_id` varchar(100) NOT NULL,
  `date` varchar(100) NOT NULL,
  `status` varchar(80) NOT NULL,
  `table_name` varchar(50) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `action_type` enum('CREATE','UPDATE','DELETE','LOGIN','LOGOUT') DEFAULT 'CREATE',
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  PRIMARY KEY (`audit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Dumping data for table gwldb.audit: ~0 rows (approximately)

-- Dumping structure for table gwldb.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `registration_date` datetime DEFAULT current_timestamp(),
  `status` enum('active','inactive') DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `customer_type` enum('regular','vip','corporate') DEFAULT 'regular',
  `city` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `credit_limit` decimal(10,2) DEFAULT 0.00,
  `preferences` text DEFAULT NULL,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `phone_number` (`phone_number`),
  KEY `idx_phone` (`phone_number`),
  KEY `idx_name` (`customer_name`),
  KEY `idx_customers_created_at` (`created_at`),
  KEY `idx_customers_updated_at` (`updated_at`),
  KEY `idx_customers_deleted_at` (`deleted_at`),
  KEY `idx_customers_customer_type` (`customer_type`),
  KEY `idx_customers_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.customers: ~3 rows (approximately)
INSERT INTO `customers` (`customer_id`, `customer_name`, `phone_number`, `registration_date`, `status`, `notes`, `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`, `deleted_by`, `email`, `address`, `customer_type`, `city`, `postal_code`, `date_of_birth`, `gender`, `discount_percentage`, `credit_limit`, `preferences`) VALUES
	(139, 'Ahmed Hassan', '+251911123456', '2025-08-03 00:00:00', 'active', NULL, '2025-08-02 16:00:00', '2025-08-02 19:49:42', NULL, NULL, NULL, NULL, 'ahmed@email.com', '123 Main Street', 'regular', 'Addis Ababa', NULL, NULL, NULL, 0.00, 0.00, NULL),
	(140, 'Fatima Ali', '+251922234567', '2025-08-03 00:00:00', 'active', NULL, '2025-08-02 16:00:00', '2025-08-02 19:49:42', NULL, NULL, NULL, NULL, 'fatima@email.com', '456 Second Avenue', 'vip', 'Addis Ababa', NULL, NULL, NULL, 0.00, 0.00, NULL),
	(141, 'Mohamed Omar', '+251933345678', '2025-08-03 00:00:00', 'active', NULL, '2025-08-02 16:00:00', '2025-08-02 19:49:42', NULL, NULL, NULL, NULL, 'mohamed@email.com', '789 Third Street', 'corporate', 'Addis Ababa', NULL, NULL, NULL, 0.00, 0.00, NULL);

-- Dumping structure for view gwldb.customer_summary
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `customer_summary` (
	`customer_id` INT(11) NOT NULL,
	`customer_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`phone_number` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`registration_date` DATETIME NULL,
	`status` ENUM('active','inactive') NULL COLLATE 'utf8mb4_unicode_ci',
	`total_orders` BIGINT(21) NOT NULL,
	`total_spent` DECIMAL(32,2) NOT NULL,
	`total_paid` DECIMAL(32,2) NOT NULL,
	`total_balance` DECIMAL(33,2) NOT NULL,
	`last_order_date` DATETIME NULL
) ENGINE=MyISAM;

-- Dumping structure for view gwldb.daily_sales_summary
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `daily_sales_summary` (
	`sale_date` DATE NULL,
	`total_orders` BIGINT(21) NOT NULL,
	`unique_customers` BIGINT(21) NOT NULL,
	`total_revenue` DECIMAL(32,2) NULL,
	`total_discounts` DECIMAL(32,2) NULL,
	`total_tax` DECIMAL(32,2) NULL,
	`total_final_amount` DECIMAL(34,2) NULL,
	`total_collected` DECIMAL(32,2) NULL,
	`total_outstanding` DECIMAL(35,2) NULL,
	`average_order_value` DECIMAL(16,6) NULL,
	`completed_orders` BIGINT(21) NOT NULL,
	`cancelled_orders` BIGINT(21) NOT NULL,
	`pending_orders` BIGINT(21) NOT NULL,
	`in_progress_orders` BIGINT(21) NOT NULL,
	`ready_orders` BIGINT(21) NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for table gwldb.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `order_date` datetime DEFAULT current_timestamp(),
  `due_date` date NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `status` enum('pending','washing','ready','delivered','cancelled') DEFAULT 'pending',
  `payment_status` enum('unpaid','partial','paid') DEFAULT 'unpaid',
  `payment_method` enum('cash','ebirr','cbe','bank_transfer') DEFAULT 'cash',
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `discount` decimal(10,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `final_amount` decimal(10,2) GENERATED ALWAYS AS (`total_amount` - `discount_amount` + `tax_amount`) STORED,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `special_instructions` text DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_number` (`order_number`),
  UNIQUE KEY `unique_order_number` (`order_number`),
  KEY `idx_order_number` (`order_number`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_deleted_at` (`deleted_at`),
  KEY `idx_orders_order_number` (`order_number`),
  KEY `idx_orders_priority` (`priority`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.orders: ~0 rows (approximately)

-- Dumping structure for table gwldb.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) GENERATED ALWAYS AS (`quantity` * `unit_price`) STORED,
  `color` varchar(100) DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL,
  `special_instructions` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  `condition_before` text DEFAULT NULL,
  `condition_after` text DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  PRIMARY KEY (`item_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_order_items_created_at` (`created_at`),
  KEY `idx_order_items_updated_at` (`updated_at`),
  KEY `idx_order_items_deleted_at` (`deleted_at`),
  KEY `idx_order_items_status` (`status`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.order_items: ~0 rows (approximately)

-- Dumping structure for view gwldb.order_summary
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `order_summary` (
	`order_id` INT(11) NOT NULL,
	`order_number` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`customer_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`phone_number` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`order_date` DATETIME NULL,
	`due_date` DATE NOT NULL,
	`delivery_date` DATE NULL,
	`total_amount` DECIMAL(10,2) NOT NULL,
	`paid_amount` DECIMAL(10,2) NULL,
	`balance` DECIMAL(11,2) NOT NULL,
	`status` ENUM('pending','washing','ready','delivered','cancelled') NULL COLLATE 'utf8mb4_unicode_ci',
	`payment_status` ENUM('unpaid','partial','paid') NULL COLLATE 'utf8mb4_unicode_ci',
	`payment_method` ENUM('cash','ebirr','cbe','bank_transfer') NULL COLLATE 'utf8mb4_unicode_ci',
	`notes` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`total_items` BIGINT(21) NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for table gwldb.payments
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `payment_date` datetime DEFAULT current_timestamp(),
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','ebirr','cbe','bank_transfer') NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `processed_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','completed','failed','cancelled','refunded') DEFAULT 'completed',
  `receipt_number` varchar(50) DEFAULT NULL,
  `refund_amount` decimal(10,2) DEFAULT 0.00,
  `refund_reason` text DEFAULT NULL,
  `payment_type` enum('full','partial','advance','refund') DEFAULT 'partial',
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `idx_order` (`order_id`),
  KEY `idx_payment_date` (`payment_date`),
  KEY `idx_payments_created_at` (`created_at`),
  KEY `idx_payments_updated_at` (`updated_at`),
  KEY `idx_payments_deleted_at` (`deleted_at`),
  KEY `idx_payment_method` (`payment_method`),
  KEY `idx_status` (`status`),
  KEY `idx_receipt_number` (`receipt_number`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_transaction_id` (`transaction_id`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.payments: ~0 rows (approximately)

-- Dumping structure for table gwldb.payment_analytics
CREATE TABLE IF NOT EXISTS `payment_analytics` (
  `analytics_id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `total_count` int(11) DEFAULT 0,
  `avg_amount` decimal(10,2) DEFAULT 0.00,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`analytics_id`),
  UNIQUE KEY `unique_date_method` (`date`,`payment_method`),
  KEY `idx_date` (`date`),
  KEY `idx_method` (`payment_method`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.payment_analytics: ~0 rows (approximately)

-- Dumping structure for table gwldb.payment_methods
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `method_id` int(11) NOT NULL AUTO_INCREMENT,
  `method_code` varchar(50) NOT NULL,
  `method_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `requires_reference` tinyint(1) DEFAULT 0,
  `icon` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`method_id`),
  UNIQUE KEY `method_code` (`method_code`),
  KEY `idx_active` (`is_active`),
  KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.payment_methods: ~0 rows (approximately)
INSERT INTO `payment_methods` (`method_id`, `method_code`, `method_name`, `description`, `is_active`, `requires_reference`, `icon`, `sort_order`, `created_at`, `updated_at`) VALUES
	(7, 'cash', 'Cash', 'Cash payment', 1, 0, NULL, 1, '2025-08-03 03:44:47', '2025-08-03 03:44:47'),
	(8, 'ebirr', 'E-Birr', 'E-Birr mobile payment', 1, 1, NULL, 2, '2025-08-03 03:44:47', '2025-08-03 03:44:47'),
	(9, 'cbe', 'CBE Birr', 'Commercial Bank of Ethiopia mobile payment', 1, 1, NULL, 3, '2025-08-03 03:44:47', '2025-08-03 03:44:47'),
	(10, 'bank_transfer', 'Bank Transfer', 'Bank to bank transfer', 1, 1, NULL, 4, '2025-08-03 03:44:47', '2025-08-03 03:44:47'),
	(11, 'credit_card', 'Credit Card', 'Credit card payment', 1, 1, NULL, 5, '2025-08-03 03:44:47', '2025-08-03 03:44:47'),
	(12, 'debit_card', 'Debit Card', 'Debit card payment', 1, 1, NULL, 6, '2025-08-03 03:44:47', '2025-08-03 03:44:47');

-- Dumping structure for table gwldb.payment_receipts
CREATE TABLE IF NOT EXISTS `payment_receipts` (
  `receipt_id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` int(11) NOT NULL,
  `receipt_number` varchar(50) NOT NULL,
  `receipt_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`receipt_data`)),
  `generated_at` datetime DEFAULT current_timestamp(),
  `generated_by` varchar(100) DEFAULT NULL,
  `printed_at` datetime DEFAULT NULL,
  `email_sent_at` datetime DEFAULT NULL,
  `sms_sent_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`receipt_id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `idx_payment` (`payment_id`),
  KEY `idx_receipt_number` (`receipt_number`),
  CONSTRAINT `payment_receipts_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.payment_receipts: ~0 rows (approximately)

-- Dumping structure for table gwldb.payment_refunds
CREATE TABLE IF NOT EXISTS `payment_refunds` (
  `refund_id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` int(11) NOT NULL,
  `refund_amount` decimal(10,2) NOT NULL,
  `refund_reason` text NOT NULL,
  `refund_method` enum('cash','ebirr','cbe','bank_transfer','credit_card','debit_card') NOT NULL,
  `refund_reference` varchar(100) DEFAULT NULL,
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  `processed_by` varchar(100) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`refund_id`),
  KEY `idx_payment` (`payment_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `payment_refunds_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.payment_refunds: ~0 rows (approximately)

-- Dumping structure for view gwldb.payment_summary
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `payment_summary` (
	`payment_id` INT(11) NOT NULL,
	`order_id` INT(11) NOT NULL,
	`order_number` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`customer_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`phone_number` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`email` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`payment_date` DATETIME NULL,
	`amount` DECIMAL(10,2) NOT NULL,
	`payment_method` ENUM('cash','ebirr','cbe','bank_transfer') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`payment_type` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`reference_number` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`transaction_id` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`status` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`processed_by` VARCHAR(1) NOT NULL COLLATE 'latin1_swedish_ci',
	`notes` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`created_at` TIMESTAMP NULL
) ENGINE=MyISAM;

-- Dumping structure for table gwldb.receipts
CREATE TABLE IF NOT EXISTS `receipts` (
  `receipt_id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_number` varchar(50) NOT NULL,
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
  `email_sent` tinyint(1) DEFAULT 0,
  `email_sent_at` timestamp NULL DEFAULT NULL,
  `print_count` int(11) DEFAULT 0,
  `last_printed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`receipt_id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `fk_receipts_order` (`order_id`),
  KEY `fk_receipts_payment` (`payment_id`),
  KEY `fk_receipts_customer` (`customer_id`),
  KEY `idx_receipts_number` (`receipt_number`),
  KEY `idx_receipts_type` (`receipt_type`),
  KEY `idx_receipts_status` (`status`),
  KEY `idx_receipts_created_at` (`created_at`),
  KEY `idx_receipts_updated_at` (`updated_at`),
  KEY `idx_receipts_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_receipts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_receipts_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_receipts_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.receipts: ~0 rows (approximately)

-- Dumping structure for table gwldb.register
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
  `mobnum` bigint(20) NOT NULL,
  `payCheck` varchar(50) NOT NULL,
  `col` varchar(100) DEFAULT NULL,
  `siz` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`itemNum`),
  KEY `idx_register_mobnum` (`mobnum`),
  KEY `idx_register_paycheck` (`payCheck`),
  KEY `idx_register_duedate` (`duedate`),
  KEY `idx_register_name` (`NAME`)
) ENGINE=InnoDB AUTO_INCREMENT=13912 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.register: ~0 rows (approximately)

-- Dumping structure for table gwldb.registeral
CREATE TABLE IF NOT EXISTS `registeral` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `laundry_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`laundry_items`)),
  `drop_off_date` datetime DEFAULT NULL,
  `pickup_date` datetime DEFAULT NULL,
  `delivery_status` enum('pending','ready','delivered','cancelled') DEFAULT 'pending',
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `payment_status` enum('pending','partial','paid') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `role` enum('admin','user','manager') DEFAULT 'user',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_register_phone` (`phone`),
  KEY `idx_register_delivery_status` (`delivery_status`),
  KEY `idx_register_payment_status` (`payment_status`),
  KEY `idx_register_drop_off_date` (`drop_off_date`),
  KEY `idx_register_pickup_date` (`pickup_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.registeral: ~0 rows (approximately)

-- Dumping structure for table gwldb.services
CREATE TABLE IF NOT EXISTS `services` (
  `service_id` int(11) NOT NULL AUTO_INCREMENT,
  `service_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `unit` varchar(50) DEFAULT 'piece',
  `category` varchar(100) DEFAULT NULL,
  `estimated_time` int(11) DEFAULT NULL COMMENT 'Time in hours',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`service_id`),
  KEY `idx_services_name` (`service_name`),
  KEY `idx_services_category` (`category`),
  KEY `idx_services_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.services: ~0 rows (approximately)

-- Dumping structure for table gwldb.user accounts
CREATE TABLE IF NOT EXISTS `user accounts` (
  `PERSONAL ID` int(15) NOT NULL,
  `fname` varchar(100) NOT NULL,
  `USERNAME` varchar(30) NOT NULL,
  `PASSWORD` varchar(255) DEFAULT NULL,
  `CITY` varchar(20) NOT NULL,
  `PHONENO` varchar(30) NOT NULL,
  `POSITION` varchar(30) NOT NULL,
  `sec_que` varchar(100) NOT NULL,
  `IMAGE` longblob DEFAULT NULL,
  `answer` varchar(100) NOT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`PERSONAL ID`),
  UNIQUE KEY `PEROSNAL ID` (`PERSONAL ID`),
  KEY `idx_user_accounts_created_at` (`created_at`),
  KEY `idx_user_accounts_updated_at` (`updated_at`),
  KEY `idx_user_accounts_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Dumping data for table gwldb.user accounts: ~0 rows (approximately)

-- Dumping structure for table gwldb.users
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('admin','user','manager') DEFAULT 'user',
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table gwldb.users: ~1 rows (approximately)
INSERT INTO `users` (`user_id`, `username`, `password_hash`, `full_name`, `role`, `status`, `last_login`, `created_at`, `updated_at`) VALUES
	(1, 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PmvlIW', 'System Administrator', 'admin', 'active', NULL, '2025-08-02 18:06:54', '2025-08-02 18:06:54');

-- Dumping structure for trigger gwldb.generate_order_number
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
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
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger gwldb.generate_order_number_before_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `generate_order_number_before_insert` 
BEFORE INSERT ON `orders`
FOR EACH ROW
BEGIN
    -- Only generate if order_number is not provided
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SET NEW.order_number = CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(LAST_INSERT_ID(), 4, '0'));
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger gwldb.generate_receipt_number
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
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
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger gwldb.update_order_total_after_item_delete
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
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
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger gwldb.update_order_total_after_item_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
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
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger gwldb.update_order_total_after_item_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
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
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger gwldb.update_payment_analytics
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
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
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger gwldb.update_payment_status_after_payment_delete
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `update_payment_status_after_payment_delete` 
AFTER UPDATE ON `payments`
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2);
    DECLARE order_total DECIMAL(10,2);
    
    -- Only process if payment was soft-deleted
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        -- Calculate total payments for this order (excluding deleted ones)
        SELECT IFNULL(SUM(amount), 0) INTO total_paid 
        FROM payments 
        WHERE order_id = NEW.order_id AND deleted_at IS NULL;
        
        -- Get the order total (including discounts and tax)
        SELECT (total_amount - IFNULL(discount_amount, 0.00) + IFNULL(tax_amount, 0.00)) INTO order_total 
        FROM orders 
        WHERE order_id = NEW.order_id;
        
        -- Update the order with new payment information
        UPDATE orders 
        SET 
            paid_amount = total_paid,
            payment_status = CASE 
                WHEN total_paid = 0 THEN 'unpaid'
                WHEN total_paid >= order_total THEN 'paid'
                ELSE 'partial'
            END
        WHERE order_id = NEW.order_id;
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger gwldb.update_payment_status_after_payment_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `update_payment_status_after_payment_insert` 
AFTER INSERT ON `payments`
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2);
    DECLARE order_total DECIMAL(10,2);
    
    -- Calculate total payments for this order
    SELECT IFNULL(SUM(amount), 0) INTO total_paid 
    FROM payments 
    WHERE order_id = NEW.order_id AND deleted_at IS NULL;
    
    -- Get the order total (including discounts and tax)
    SELECT (total_amount - IFNULL(discount_amount, 0.00) + IFNULL(tax_amount, 0.00)) INTO order_total 
    FROM orders 
    WHERE order_id = NEW.order_id;
    
    -- Update the order with new payment information
    UPDATE orders 
    SET 
        paid_amount = total_paid,
        payment_status = CASE 
            WHEN total_paid = 0 THEN 'unpaid'
            WHEN total_paid >= order_total THEN 'paid'
            ELSE 'partial'
        END
    WHERE order_id = NEW.order_id;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger gwldb.update_payment_status_after_payment_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `update_payment_status_after_payment_update` 
AFTER UPDATE ON `payments`
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2);
    DECLARE order_total DECIMAL(10,2);
    
    -- Calculate total payments for this order
    SELECT IFNULL(SUM(amount), 0) INTO total_paid 
    FROM payments 
    WHERE order_id = NEW.order_id AND deleted_at IS NULL;
    
    -- Get the order total (including discounts and tax)
    SELECT (total_amount - IFNULL(discount_amount, 0.00) + IFNULL(tax_amount, 0.00)) INTO order_total 
    FROM orders 
    WHERE order_id = NEW.order_id;
    
    -- Update the order with new payment information
    UPDATE orders 
    SET 
        paid_amount = total_paid,
        payment_status = CASE 
            WHEN total_paid = 0 THEN 'unpaid'
            WHEN total_paid >= order_total THEN 'paid'
            ELSE 'partial'
        END
    WHERE order_id = NEW.order_id;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `customer_summary`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `customer_summary` AS select `c`.`customer_id` AS `customer_id`,`c`.`customer_name` AS `customer_name`,`c`.`phone_number` AS `phone_number`,`c`.`registration_date` AS `registration_date`,`c`.`status` AS `status`,count(distinct `o`.`order_id`) AS `total_orders`,ifnull(sum(`o`.`total_amount`),0) AS `total_spent`,ifnull(sum(`o`.`paid_amount`),0) AS `total_paid`,ifnull(sum(`o`.`total_amount` - ifnull(`o`.`paid_amount`,0)),0) AS `total_balance`,max(`o`.`order_date`) AS `last_order_date` from (`customers` `c` left join `orders` `o` on(`c`.`customer_id` = `o`.`customer_id` and `o`.`deleted_at` is null)) where `c`.`deleted_at` is null group by `c`.`customer_id`
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `daily_sales_summary`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `daily_sales_summary` AS select cast(`o`.`order_date` as date) AS `sale_date`,count(distinct `o`.`order_id`) AS `total_orders`,count(distinct `o`.`customer_id`) AS `unique_customers`,sum(`o`.`total_amount`) AS `total_revenue`,sum(ifnull(`o`.`discount_amount`,0.00)) AS `total_discounts`,sum(ifnull(`o`.`tax_amount`,0.00)) AS `total_tax`,sum(`o`.`total_amount` - ifnull(`o`.`discount_amount`,0.00) + ifnull(`o`.`tax_amount`,0.00)) AS `total_final_amount`,sum(`o`.`paid_amount`) AS `total_collected`,sum(`o`.`total_amount` - ifnull(`o`.`discount_amount`,0.00) + ifnull(`o`.`tax_amount`,0.00) - ifnull(`o`.`paid_amount`,0)) AS `total_outstanding`,case when count(distinct `o`.`order_id`) > 0 then avg(`o`.`total_amount` - ifnull(`o`.`discount_amount`,0.00) + ifnull(`o`.`tax_amount`,0.00)) else 0 end AS `average_order_value`,count(case when `o`.`status` = 'delivered' then 1 end) AS `completed_orders`,count(case when `o`.`status` = 'cancelled' then 1 end) AS `cancelled_orders`,count(case when `o`.`status` = 'pending' then 1 end) AS `pending_orders`,count(case when `o`.`status` = 'in_progress' then 1 end) AS `in_progress_orders`,count(case when `o`.`status` = 'ready' then 1 end) AS `ready_orders` from `orders` `o` where `o`.`deleted_at` is null or `o`.`deleted_at` is null group by cast(`o`.`order_date` as date) order by cast(`o`.`order_date` as date) desc
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `order_summary`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `order_summary` AS select `o`.`order_id` AS `order_id`,`o`.`order_number` AS `order_number`,`c`.`customer_name` AS `customer_name`,`c`.`phone_number` AS `phone_number`,`o`.`order_date` AS `order_date`,`o`.`due_date` AS `due_date`,`o`.`delivery_date` AS `delivery_date`,`o`.`total_amount` AS `total_amount`,`o`.`paid_amount` AS `paid_amount`,`o`.`total_amount` - ifnull(`o`.`paid_amount`,0) AS `balance`,`o`.`status` AS `status`,`o`.`payment_status` AS `payment_status`,`o`.`payment_method` AS `payment_method`,`o`.`notes` AS `notes`,count(`oi`.`item_id`) AS `total_items` from ((`orders` `o` join `customers` `c` on(`o`.`customer_id` = `c`.`customer_id`)) left join `order_items` `oi` on(`o`.`order_id` = `oi`.`order_id` and `oi`.`deleted_at` is null)) where `o`.`deleted_at` is null and `c`.`deleted_at` is null group by `o`.`order_id`
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `payment_summary`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `payment_summary` AS select `p`.`payment_id` AS `payment_id`,`p`.`order_id` AS `order_id`,`o`.`order_number` AS `order_number`,`c`.`customer_name` AS `customer_name`,`c`.`phone_number` AS `phone_number`,ifnull(`c`.`email`,'') AS `email`,`p`.`payment_date` AS `payment_date`,`p`.`amount` AS `amount`,`p`.`payment_method` AS `payment_method`,ifnull(`p`.`payment_type`,'partial') AS `payment_type`,`p`.`reference_number` AS `reference_number`,ifnull(`p`.`transaction_id`,'') AS `transaction_id`,ifnull(`p`.`status`,'completed') AS `status`,ifnull(`ua`.`fname`,'System') AS `processed_by`,`p`.`notes` AS `notes`,`p`.`created_at` AS `created_at` from (((`payments` `p` left join `orders` `o` on(`p`.`order_id` = `o`.`order_id`)) left join `customers` `c` on(`o`.`customer_id` = `c`.`customer_id`)) left join `user accounts` `ua` on(`p`.`created_by` = `ua`.`PERSONAL ID`)) where `p`.`deleted_at` is null
;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
