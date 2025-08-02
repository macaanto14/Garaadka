-- Quick fix - recreate the register table
-- WARNING: This will delete all existing data in the register table

DROP TABLE IF EXISTS `register`;

CREATE TABLE `registeral` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `laundry_items` JSON DEFAULT NULL,
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
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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