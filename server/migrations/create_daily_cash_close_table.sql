-- Create daily_cash_close table for end-of-day cash management
CREATE TABLE IF NOT EXISTS `daily_cash_close` (
  `close_id` int(11) NOT NULL AUTO_INCREMENT,
  `close_date` date NOT NULL,
  `cash_amount` decimal(10,2) DEFAULT 0.00,
  `card_amount` decimal(10,2) DEFAULT 0.00,
  `mobile_amount` decimal(10,2) DEFAULT 0.00,
  `bank_transfer_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `expenses_amount` decimal(10,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`close_id`),
  UNIQUE KEY `unique_close_date` (`close_date`),
  KEY `idx_close_date` (`close_date`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create expenses table if it doesn't exist (for tracking daily expenses)
CREATE TABLE IF NOT EXISTS `expenses` (
  `expense_id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `payment_method` enum('cash','card','mobile','bank_transfer') DEFAULT 'cash',
  `receipt_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`expense_id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_category` (`category`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create view for daily cash summary
CREATE OR REPLACE VIEW `daily_cash_summary` AS
SELECT 
    DATE(o.order_date) as summary_date,
    COUNT(o.order_id) as total_orders,
    SUM(o.total_amount) as total_order_value,
    SUM(o.paid_amount) as total_paid_amount,
    SUM(o.total_amount - o.paid_amount) as total_unpaid_amount,
    COUNT(CASE WHEN o.payment_status = 'paid' THEN 1 END) as fully_paid_orders,
    COUNT(CASE WHEN o.payment_status = 'partial' THEN 1 END) as partially_paid_orders,
    COUNT(CASE WHEN o.payment_status = 'unpaid' THEN 1 END) as unpaid_orders,
    COALESCE(p.cash_received, 0) as cash_received,
    COALESCE(p.card_received, 0) as card_received,
    COALESCE(p.mobile_received, 0) as mobile_received,
    COALESCE(p.bank_transfer_received, 0) as bank_transfer_received,
    COALESCE(p.total_payments, 0) as total_payments_received,
    COALESCE(e.total_expenses, 0) as total_expenses,
    dcc.close_id,
    dcc.total_amount as closed_amount,
    dcc.notes as close_notes
FROM orders o
LEFT JOIN (
    SELECT 
        DATE(payment_date) as payment_date,
        SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END) as cash_received,
        SUM(CASE WHEN payment_method = 'card' THEN amount ELSE 0 END) as card_received,
        SUM(CASE WHEN payment_method = 'mobile' THEN amount ELSE 0 END) as mobile_received,
        SUM(CASE WHEN payment_method = 'bank_transfer' THEN amount ELSE 0 END) as bank_transfer_received,
        SUM(amount) as total_payments
    FROM payments 
    WHERE deleted_at IS NULL AND status = 'completed'
    GROUP BY DATE(payment_date)
) p ON DATE(o.order_date) = p.payment_date
LEFT JOIN (
    SELECT 
        DATE(expense_date) as expense_date,
        SUM(amount) as total_expenses
    FROM expenses 
    WHERE deleted_at IS NULL
    GROUP BY DATE(expense_date)
) e ON DATE(o.order_date) = e.expense_date
LEFT JOIN daily_cash_close dcc ON DATE(o.order_date) = dcc.close_date
WHERE o.deleted_at IS NULL
GROUP BY DATE(o.order_date), p.cash_received, p.card_received, p.mobile_received, 
         p.bank_transfer_received, p.total_payments, e.total_expenses, 
         dcc.close_id, dcc.total_amount, dcc.notes
ORDER BY summary_date DESC;