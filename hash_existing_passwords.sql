-- This script will be used to hash existing plain text passwords
-- Run this after implementing JWT to secure existing passwords

-- First, let's see current users
SELECT `PERSONAL ID`, USERNAME, PASSWORD FROM `user accounts`;

-- Note: The password hashing will be handled automatically by the login endpoint
-- when users log in with their plain text passwords for the first time.
-- The system will detect plain text passwords and automatically hash them.

-- If you want to manually hash passwords, you can use the change-password endpoint
-- or update them through the application interface.