-- Complete trigger setup for automatic order calculations
-- This includes the triggers you selected plus additional payment triggers

USE `gwldb`;

-- ========================================================================
-- ORDER TOTAL CALCULATION TRIGGERS
-- ========================================================================

DELIMITER $$

-- Trigger to update order total when order items are inserted
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

-- Trigger to update order total when order items are updated
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

-- Trigger to update order total when order items are soft-deleted
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

-- ========================================================================
-- PAYMENT STATUS CALCULATION TRIGGERS
-- ========================================================================

-- Trigger to update payment status when payments are inserted
DROP TRIGGER IF EXISTS `update_payment_status_after_payment_insert`$$
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
END$$

-- Trigger to update payment status when payments are updated
DROP TRIGGER IF EXISTS `update_payment_status_after_payment_update`$$
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
END$$

-- Trigger to update payment status when payments are soft-deleted
DROP TRIGGER IF EXISTS `update_payment_status_after_payment_delete`$$
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
END$$

-- ========================================================================
-- ORDER NUMBER GENERATION TRIGGER (Optional)
-- ========================================================================

-- Trigger to auto-generate order numbers for new orders
DROP TRIGGER IF EXISTS `generate_order_number_before_insert`$$
CREATE TRIGGER `generate_order_number_before_insert` 
BEFORE INSERT ON `orders`
FOR EACH ROW
BEGIN
    -- Only generate if order_number is not provided
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SET NEW.order_number = CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(LAST_INSERT_ID(), 4, '0'));
    END IF;
END$$

DELIMITER ;

-- ========================================================================
-- TEST THE TRIGGERS
-- ========================================================================

-- Show all triggers that were created
SELECT 'Triggers created successfully!' AS status;

SELECT 'Current triggers in the database:' AS info;
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = DATABASE()
ORDER BY EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION;

-- Test trigger functionality (optional - uncomment to test)
/*
-- Insert a test customer if needed
INSERT IGNORE INTO customers (customer_name, phone_number, customer_type) 
VALUES ('Test Customer', '1234567890', 'regular');

-- Insert a test order
INSERT INTO orders (customer_id, order_date, status) 
VALUES (1, CURDATE(), 'pending');

-- Insert test order items (this should trigger total calculation)
INSERT INTO order_items (order_id, item_name, quantity, unit_price) 
VALUES 
(LAST_INSERT_ID(), 'Test Item 1', 2, 10.00),
(LAST_INSERT_ID(), 'Test Item 2', 1, 15.00);

-- Insert test payment (this should trigger payment status update)
INSERT INTO payments (order_id, amount, payment_method) 
VALUES (LAST_INSERT_ID(), 20.00, 'cash');

-- Check the results
SELECT 'Test order after triggers:' AS test_result;
SELECT order_id, order_number, total_amount, paid_amount, payment_status 
FROM orders 
WHERE order_id = LAST_INSERT_ID();
*/

SELECT 'All triggers are ready! Your database now has automatic calculations.' AS final_status;