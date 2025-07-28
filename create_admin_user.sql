-- Create default admin user for testing
INSERT INTO `user accounts` (`PERSONAL ID`, `fname`, `USERNAME`, `PASSWORD`, `CITY`, `PHONENO`, `POSITION`, `sec_que`, `IMAGE`, `answer`) 
VALUES 
(1005, 'Administrator', 'admin', 'admin123', 'Mogadishu', '+252-61-1234567', 'admin', 'What is your favorite color?', NULL, 'blue');

-- Create a test staff user as well
INSERT INTO `user accounts` (`PERSONAL ID`, `fname`, `USERNAME`, `PASSWORD`, `CITY`, `PHONENO`, `POSITION`, `sec_que`, `IMAGE`, `answer`) 
VALUES 
(1002, 'Test Staff', 'staff', 'staff123', 'Mogadishu', '+252-61-7654321', 'staff', 'What is your pet name?', NULL, 'buddy');