-- Fix audit table record_id column to support both integer and string primary keys
USE `loundary`;

-- Modify the record_id column to varchar to support both integer and string primary keys
ALTER TABLE `audit` MODIFY COLUMN `record_id` varchar(100) DEFAULT NULL;

-- Update the index if needed
DROP INDEX IF EXISTS `idx_audit_record_id` ON `audit`;
CREATE INDEX `idx_audit_record_id` ON `audit` (`record_id`);