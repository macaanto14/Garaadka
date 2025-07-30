-- Setup script for legacy register table structure
-- This script will create the register table with the exact legacy structure

-- Drop existing register table if it exists
DROP TABLE IF EXISTS register;

-- Create register table with legacy structure
CREATE TABLE register (
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
  PRIMARY KEY (`itemNum`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_register_mobnum ON register(mobnum);
CREATE INDEX idx_register_paycheck ON register(payCheck);
CREATE INDEX idx_register_duedate ON register(duedate);
CREATE INDEX idx_register_name ON register(NAME);

-- Insert sample data for testing
INSERT INTO register (
  NAME, descr, quan, unitprice, amntword, duedate, deliverdate, 
  totalAmount, mobnum, payCheck, col, siz
) VALUES 
(
  'Ahmed Hassan', 
  'Laundry service - shirts and pants', 
  5, 
  10, 
  'Fifty dollars', 
  '2024-01-15', 
  '2024-01-17', 
  50, 
  252612345678, 
  'pending', 
  'Blue, White', 
  'Medium, Large'
),
(
  'Fatima Ali', 
  'Dry cleaning - formal dress', 
  2, 
  25, 
  'Fifty dollars', 
  '2024-01-16', 
  '2024-01-18', 
  50, 
  252613456789, 
  'paid', 
  'Black', 
  'Small'
),
(
  'Mohamed Omar', 
  'Washing and ironing - bedsheets', 
  3, 
  15, 
  'Forty five dollars', 
  '2024-01-17', 
  '2024-01-19', 
  45, 
  252614567890, 
  'partial', 
  'White', 
  'King size'
);

-- Show table structure
DESCRIBE register;

-- Show sample data
SELECT * FROM register LIMIT 5;

-- Show statistics
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN payCheck = 'pending' THEN 1 END) as pending_payments,
  COUNT(CASE WHEN payCheck = 'paid' THEN 1 END) as paid_orders,
  COUNT(CASE WHEN payCheck = 'partial' THEN 1 END) as partial_payments,
  SUM(totalAmount) as total_revenue
FROM register;