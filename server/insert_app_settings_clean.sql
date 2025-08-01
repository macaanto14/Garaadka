-- Clean INSERT statement for app_settings table
-- This file contains only the INSERT statement without any inline comments

INSERT INTO `app_settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_system`) VALUES
('serial_number_config', '{"prefix": "PKG", "randomDigits": 4, "separator": "", "format": "prefix+random"}', 'json', 'serial_numbers', 'Package serial number generation configuration', FALSE),
('order_id_config', '{"prefix": "ORD", "randomDigits": 6, "separator": "-", "format": "prefix+separator+random", "includeDate": false, "dateFormat": "YYYYMMDD"}', 'json', 'order_ids', 'Order ID generation configuration', FALSE),
('business_info', '{"name": "Garaad wil waal Laundry", "address": "", "phone": "", "email": "", "website": "", "taxId": "", "logo": null, "description": "", "workingHours": "Mon-Sat: 8:00 AM - 8:00 PM", "currency": "USD", "timezone": "UTC"}', 'json', 'business', 'Business information and contact details', FALSE),
('invoice_settings', '{"template": "default", "showLogo": true, "showBusinessInfo": true, "showTaxInfo": false, "footerText": "Thank you for your business!", "termsAndConditions": "", "autoGenerate": true, "numberFormat": "INV-{number}", "startingNumber": 1000, "includeQRCode": false}', 'json', 'invoices', 'Invoice generation and formatting settings', FALSE),
('notification_settings', '{"orderNotifications": true, "paymentReminders": true, "lowStockAlerts": false, "customerUpdates": true, "systemMaintenance": true, "emailNotifications": true, "pushNotifications": false, "smsNotifications": false, "autoClose": 5000, "position": "top-right", "sound": true}', 'json', 'notifications', 'Notification preferences and settings', FALSE),
('theme_settings', '{"mode": "light", "primaryColor": "#3b82f6", "fontSize": "medium", "compactMode": false, "sidebarCollapsed": false, "showAnimations": true, "customCSS": ""}', 'json', 'theme', 'Theme and appearance customization', FALSE),
('app_language', '"en"', 'string', 'general', 'Default application language', FALSE),
('app_version', '"1.0.0"', 'string', 'system', 'Application version', TRUE),
('last_backup', 'null', 'string', 'system', 'Last database backup timestamp', TRUE)
ON DUPLICATE KEY UPDATE 
`setting_value` = VALUES(`setting_value`),
`updated_at` = CURRENT_TIMESTAMP;