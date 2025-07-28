-- Check customers
SELECT * FROM customers ORDER BY registration_date DESC;

-- Check orders with customer info
SELECT o.*, c.customer_name 
FROM orders o 
JOIN customers c ON o.customer_id = c.customer_id 
ORDER BY o.order_date DESC;

-- Check order items
SELECT oi.*, o.order_number 
FROM order_items oi 
JOIN orders o ON oi.order_id = o.order_id;

-- Check payments
SELECT p.*, o.order_number 
FROM payments p 
JOIN orders o ON p.order_id = o.order_id;

-- Check audit logs
SELECT * FROM audit ORDER BY timestamp DESC LIMIT 10;

INSERT INTO `user accounts` (`PERSONAL ID`, `fname`, `USERNAME`, `PASSWORD`, `CITY`, `PHONENO`, `POSITION`, `sec_que`, `IMAGE`, `answer`) 
VALUES 
(1001, 'Administrator', 'admin', 'admin123', 'Mogadishu', '+252-61-1234567', 'admin', 'What is your favorite color?', NULL, 'blue');