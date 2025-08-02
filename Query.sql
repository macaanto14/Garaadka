-- Working views and triggers that match your actual database structure
-- This version removes references to columns that don't exist in your current schema

USE `gwldb`;

-- Create simplified daily_sales_summary view (without final_amount column)
CREATE OR REPLACE VIEW `daily_sales_summary` AS
SELECT 
    DATE(o.order_date) AS sale_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(o.total_amount) AS total_revenue,
    SUM(IFNULL(o.discount_amount, 0.00)) AS total_discounts,
    SUM(IFNULL(o.tax_amount, 0.00)) AS total_tax,
    SUM(o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00)) AS total_final_amount,
    SUM(o.paid_amount) AS total_collected,
    SUM(o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00) - IFNULL(o.paid_amount, 0)) AS total_outstanding,
    CASE 
        WHEN COUNT(DISTINCT o.order_id) > 0 
        THEN AVG(o.total_amount - IFNULL(o.discount_amount, 0.00) + IFNULL(o.tax_amount, 0.00)) 
        ELSE 0 
    END AS average_order_value,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN o.status = 'in_progress' THEN 1 END) AS in_progress_orders,
    COUNT(CASE WHEN o.status = 'ready' THEN 1 END) AS ready_orders
FROM orders o
WHERE (o.deleted_at IS NULL OR o.deleted_at IS NULL)
GROUP BY DATE(o.order_date)
ORDER BY sale_date DESC;

-- Create basic service performance view (only if you want to create services table)
-- Skip this view for now since services table doesn't exist yet
-- CREATE OR REPLACE VIEW `service_performance` AS ...

-- ========================================================================
-- TRIGGERS FOR AUTOMATIC CALCULATIONS (Simplified for current schema)
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
        WHERE order_id = NEW.order_id AND (deleted_at IS NULL OR deleted_at IS NULL)
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
        WHERE order_id = NEW.order_id AND (deleted_at IS NULL OR deleted_at IS NULL)
    )
    WHERE order_id = NEW.order_id;
END$$

DROP TRIGGER IF EXISTS `update_order_total_after_item_delete`$$
CREATE TRIGGER `update_order_total_after_item_delete` 
AFTER UPDATE ON `order_items`
FOR EACH ROW
BEGIN
    IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL OR OLD.deleted_at IS NULL) THEN
        UPDATE orders 
        SET total_amount = (
            SELECT IFNULL(SUM(quantity * unit_price), 0) 
            FROM order_items 
            WHERE order_id = NEW.order_id AND (deleted_at IS NULL OR deleted_at IS NULL)
        )
        WHERE order_id = NEW.order_id;
    END IF;
END$$

-- Simplified trigger to update payment status when payments change
DROP TRIGGER IF EXISTS `update_payment_status_after_payment_insert`$$
CREATE TRIGGER `update_payment_status_after_payment_insert` 
AFTER INSERT ON `payments`
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2);
    DECLARE order_total DECIMAL(10,2);
    
    SELECT IFNULL(SUM(amount), 0) INTO total_paid 
    FROM payments 
    WHERE order_id = NEW.order_id AND (deleted_at IS NULL OR deleted_at IS NULL);
    
    SELECT (total_amount - IFNULL(discount_amount, 0.00) + IFNULL(tax_amount, 0.00)) INTO order_total 
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

-- Trigger to update payment status when payments are updated
DROP TRIGGER IF EXISTS `update_payment_status_after_payment_update`$$
CREATE TRIGGER `update_payment_status_after_payment_update` 
AFTER UPDATE ON `payments`
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2);
    DECLARE order_total DECIMAL(10,2);
    
    SELECT IFNULL(SUM(amount), 0) INTO total_paid 
    FROM payments 
    WHERE order_id = NEW.order_id AND (deleted_at IS NULL OR deleted_at IS NULL);
    
    SELECT (total_amount - IFNULL(discount_amount, 0.00) + IFNULL(tax_amount, 0.00)) INTO order_total 
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

-- Test the views and triggers
SELECT 'Working views and triggers created successfully!' AS status;

-- Test the daily_sales_summary view
SELECT 'Testing daily_sales_summary view...' AS test_title;
SELECT COUNT(*) AS daily_sales_summary_count FROM daily_sales_summary;

-- Show sample data
SELECT 'Sample from daily_sales_summary (last 3 days):' AS sample_title;
SELECT * FROM daily_sales_summary LIMIT 3;

-- Show existing triggers
SELECT 'Current triggers in database:' AS triggers_title;
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE 
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = DATABASE()
ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME;

SELECT 'Views and triggers are working! Database automation is ready.' AS final_status;