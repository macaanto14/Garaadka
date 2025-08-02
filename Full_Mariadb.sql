-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               11.8.2-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
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


-- Dumping database structure for loundary
CREATE DATABASE IF NOT EXISTS `loundary` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `loundary`;

-- Dumping structure for table loundary.app_settings
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table loundary.audit
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
) ENGINE=InnoDB AUTO_INCREMENT=33861 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Data exporting was unselected.

-- Dumping structure for table loundary.customers
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
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `phone_number` (`phone_number`),
  KEY `idx_phone` (`phone_number`),
  KEY `idx_name` (`customer_name`),
  KEY `idx_customers_created_at` (`created_at`),
  KEY `idx_customers_updated_at` (`updated_at`),
  KEY `idx_customers_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table loundary.orders
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
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `idx_order_number` (`order_number`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_deleted_at` (`deleted_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table loundary.order_items
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
  PRIMARY KEY (`item_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_order_items_created_at` (`created_at`),
  KEY `idx_order_items_updated_at` (`updated_at`),
  KEY `idx_order_items_deleted_at` (`deleted_at`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table loundary.payments
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
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table loundary.payment_analytics
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

-- Data exporting was unselected.

-- Dumping structure for table loundary.payment_methods
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table loundary.payment_receipts
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

-- Data exporting was unselected.

-- Dumping structure for table loundary.payment_refunds
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

-- Data exporting was unselected.

-- Dumping structure for table loundary.register
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

-- Data exporting was unselected.

-- Dumping structure for table loundary.user accounts
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

-- Data exporting was unselected.

-- Dumping structure for trigger loundary.generate_order_number
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

-- Dumping structure for trigger loundary.generate_receipt_number
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

-- Dumping structure for trigger loundary.update_payment_analytics
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

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
