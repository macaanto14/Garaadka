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
-- GARAADKA LAUNDRY MANAGEMENT SYSTEM - SAFE DATABASE MIGRATION
-- ========================================================================
-- This script safely migrates your existing database to include all necessary columns
-- Version: 2.1.0 - Compatible with existing structure
-- ========================================================================

USE `gwldb`;

-- ========================================================================
-- STEP 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- ========================================================================

-- Add missing columns to customers table
ALTER TABLE `customers` 
ADD COLUMN IF NOT EXISTS `city` varchar(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `postal_code` varchar(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `date_of_birth` date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `gender` enum('male','female','other') DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `customer_type` enum('regular','vip','corporate') DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS `discount_percentage` decimal(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS `credit_limit` decimal(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS `preferences` text DEFAULT NULL;

-- Update existing customers to have 'regular' customer type
UPDATE `customers` SET `customer_type` = 'regular' WHERE `customer_type` IS NULL;

-- Add missing columns to orders table
ALTER TABLE `orders` 
ADD COLUMN IF NOT EXISTS `discount_amount` decimal(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS `tax_amount` decimal(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS `special_instructions` text DEFAULT NULL;

-- Add computed column for final_amount (if not exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'final_amount') > 0,
    'SELECT "final_amount column already exists"',
    'ALTER TABLE `orders` ADD COLUMN `final_amount` decimal(10,2) GENERATED ALWAYS AS (`total_amount` - `discount_amount` + `tax_amount`) STORED'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add missing columns to order_items table
ALTER TABLE `order_items` 
ADD COLUMN IF NOT EXISTS `condition_before` text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `condition_after` text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending';

-- Add missing columns to payments table
ALTER TABLE `payments` 
ADD COLUMN IF NOT EXISTS `payment_type` enum('full','partial','advance','refund') DEFAULT 'partial',
ADD COLUMN IF NOT EXISTS `transaction_id` varchar(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `status` enum('pending','completed','failed','cancelled') DEFAULT 'completed';

-- ========================================================================
-- STEP 2: CREATE NEW TABLES (IF NOT EXISTS)
-- ========================================================================

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

-- ========================================================================
-- STEP 3: INSERT DEFAULT DATA
-- ========================================================================

-- Insert default services
INSERT INTO `services` (`service_name`, `description`, `base_price`, `unit`, `category`, `estimated_time`, `is_active`) VALUES
('Dry Cleaning', 'Professional dry cleaning service', 25.00, 'piece', 'Cleaning', 24, TRUE),
('Washing & Ironing', 'Regular washing and ironing service', 15.00, 'piece', 'Cleaning', 12, TRUE),
('Ironing Only', 'Ironing service only', 8.00, 'piece', 'Pressing', 2, TRUE),
('Stain Removal', 'Specialized stain removal treatment', 35.00, 'piece', 'Treatment', 48, TRUE),
('Alterations', 'Clothing alterations and repairs', 20.00, 'piece', 'Tailoring', 72, TRUE),
('Express Service', 'Same day service (additional charge)', 10.00, 'piece', 'Express', 4, TRUE)
ON DUPLICATE KEY UPDATE `service_name` = `service_name`;

-- Insert sample customers (if none exist)
INSERT IGNORE INTO `customers` (`customer_name`, `phone_number`, `email`, `address`, `city`, `customer_type`, `registration_date`, `status`) VALUES
('Ahmed Hassan', '+251911123456', 'ahmed@email.com', '123 Main Street', 'Addis Ababa', 'regular', CURDATE(), 'active'),
('Fatima Ali', '+251922234567', 'fatima@email.com', '456 Second Avenue', 'Addis Ababa', 'vip', CURDATE(), 'active'),
('Mohamed Omar', '+251933345678', 'mohamed@email.com', '789 Third Street', 'Addis Ababa', 'corporate', CURDATE(), 'active');

-- ========================================================================
-- STEP 4: CREATE SAFE VIEWS (COMPATIBLE WITH EXISTING STRUCTURE)
-- ========================================================================

-- Enhanced order summary view (using existing table structure)
CREATE OR REPLACE VIEW `order_summary` AS
SELECT 
    o.order_id,
    o.order_number,
    c.customer_name,
    c.phone_number,
    IFNULL(c.email, '') AS email,
    IFNULL(c.customer_type, 'regular') AS customer_type,
    o.order_date,
    o.due_date,
    o.delivery_date,
    o.total_amount,
    IFNULL(o.discount_amount, 0.00) AS discount_amount,
    IFNULL(o.tax_amount, 0.00) AS tax_amount,
    CASE 
        WHEN o.final_amount IS NOT NULL THEN o.final_amount
        ELSE (o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00))
    END AS final_amount,
    o.paid_amount,
    (CASE 
        WHEN o.final_amount IS NOT NULL THEN o.final_amount
        ELSE (o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00))
    END - IFNULL(o.paid_amount, 0)) AS balance_amount,
    o.status,
    o.payment_status,
    o.payment_method,
    IFNULL(o.priority, 'normal') AS priority,
    IFNULL(o.special_instructions, '') AS special_instructions,
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
    IFNULL(c.email, '') AS email,
    IFNULL(c.address, '') AS address,
    IFNULL(c.city, '') AS city,
    IFNULL(c.customer_type, 'regular') AS customer_type,
    IFNULL(c.discount_percentage, 0.00) AS discount_percentage,
    IFNULL(c.credit_limit, 0.00) AS credit_limit,
    c.registration_date,
    c.status,
    COUNT(DISTINCT o.order_id) AS total_orders,
    IFNULL(SUM(CASE 
        WHEN o.final_amount IS NOT NULL THEN o.final_amount
        ELSE (o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00))
    END), 0) AS total_spent,
    IFNULL(SUM(o.paid_amount), 0) AS total_paid,
    IFNULL(SUM(CASE 
        WHEN o.final_amount IS NOT NULL THEN o.final_amount
        ELSE (o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00))
    END - IFNULL(o.paid_amount, 0)), 0) AS total_balance,
    MAX(o.order_date) AS last_order_date,
    MIN(o.order_date) AS first_order_date,
    CASE 
        WHEN COUNT(DISTINCT o.order_id) > 0 
        THEN AVG(CASE 
            WHEN o.final_amount IS NOT NULL THEN o.final_amount
            ELSE (o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00))
        END) 
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
    IFNULL(c.email, '') AS email,
    p.payment_date,
    p.amount,
    p.payment_method,
    IFNULL(p.payment_type, 'partial') AS payment_type,
    p.reference_number,
    IFNULL(p.transaction_id, '') AS transaction_id,
    IFNULL(p.status, 'completed') AS status,
    IFNULL(ua.fname, 'System') AS processed_by,
    p.notes,
    p.created_at
FROM payments p
LEFT JOIN orders o ON p.order_id = o.order_id
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN `user accounts` ua ON p.created_by = ua.`PERSONAL ID`
WHERE p.deleted_at IS NULL;

-- Daily sales summary view
CREATE OR REPLACE VIEW `daily_sales_summary` AS
SELECT 
    DATE(o.order_date) AS sale_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(o.total_amount) AS total_revenue,
    SUM(IFNULL(o.discount_amount, 0.00)) AS total_discounts,
    SUM(IFNULL(o.tax_amount, 0.00)) AS total_tax,
    SUM(CASE 
        WHEN o.final_amount IS NOT NULL THEN o.final_amount
        ELSE (o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00))
    END) AS total_final_amount,
    SUM(o.paid_amount) AS total_collected,
    SUM(CASE 
        WHEN o.final_amount IS NOT NULL THEN o.final_amount
        ELSE (o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00))
    END - IFNULL(o.paid_amount, 0)) AS total_outstanding,
    CASE 
        WHEN COUNT(DISTINCT o.order_id) > 0 
        THEN AVG(CASE 
            WHEN o.final_amount IS NOT NULL THEN o.final_amount
            ELSE (o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00))
        END) 
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

-- Service performance view (if services table exists)
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
-- STEP 5: CREATE/UPDATE TRIGGERS FOR AUTOMATIC CALCULATIONS
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
    
    SELECT CASE 
        WHEN final_amount IS NOT NULL THEN final_amount
        ELSE (total_amount - IFNULL(discount_amount, 0.00) + IFNULL(tax_amount, 0.00))
    END INTO order_total 
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

DELIMITER ;

-- ========================================================================
-- STEP 6: CREATE ADDITIONAL INDEXES FOR PERFORMANCE
-- ========================================================================

-- Add new indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS `idx_customers_customer_type` ON `customers` (`customer_type`);
CREATE INDEX IF NOT EXISTS `idx_customers_email` ON `customers` (`email`);
CREATE INDEX IF NOT EXISTS `idx_orders_priority` ON `orders` (`priority`);
CREATE INDEX IF NOT EXISTS `idx_order_items_status` ON `order_items` (`status`);
CREATE INDEX IF NOT EXISTS `idx_payments_status` ON `payments` (`status`);
CREATE INDEX IF NOT EXISTS `idx_payments_transaction_id` ON `payments` (`transaction_id`);

-- ========================================================================
-- STEP 7: FINAL VERIFICATION AND TESTING
-- ========================================================================

-- Test all views
SELECT 'Safe database migration completed successfully!' AS status;
SELECT 'Testing views...' AS test;

SELECT COUNT(*) AS order_summary_count FROM order_summary;
SELECT COUNT(*) AS customer_summary_count FROM customer_summary;
SELECT COUNT(*) AS payment_summary_count FROM payment_summary;
SELECT COUNT(*) AS daily_sales_summary_count FROM daily_sales_summary;
SELECT COUNT(*) AS service_performance_count FROM service_performance;

-- Show enhanced table information
SELECT 
    'customers' AS table_name, 
    COUNT(*) AS record_count,
    COUNT(CASE WHEN customer_type IS NOT NULL THEN 1 END) AS with_customer_type
FROM customers
UNION ALL
SELECT 
    'orders' AS table_name, 
    COUNT(*) AS record_count,
    COUNT(CASE WHEN discount_amount IS NOT NULL THEN 1 END) AS with_discount_amount
FROM orders
UNION ALL
SELECT 
    'services' AS table_name, 
    COUNT(*) AS record_count,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) AS active_services
FROM services;

SELECT 'All views are working! Database migration completed successfully.' AS final_status;

-- ========================================================================
-- STEP 8: FINAL CLEANUP
-- ========================================================================

-- Reset SQL settings
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;