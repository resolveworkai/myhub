-- SQL Cleanup Script for Test Data
-- This script deletes test signup data for both Member and Business users
-- Last Updated: January 25, 2026
--
-- WARNING: This script permanently deletes data. Use only on test/development databases.
-- Always backup your database before running cleanup scripts.
--
-- Usage:
--   psql -U postgres -d portal_db -f docs/database/cleanup-test-users.sql
--   Or run in your database client tool

BEGIN;

-- ============================================
-- 1. DELETE TEST MEMBER USERS
-- ============================================
-- Delete test users (you can modify the WHERE clause to match your test data criteria)
-- Example: Delete users created in the last 7 days with test email patterns

DELETE FROM audit_logs
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%@example.com'
     OR email LIKE '%@test.com'
     OR created_at > NOW() - INTERVAL '7 days'
)
AND deleted_at IS NULL;

DELETE FROM otps
WHERE email IN (
  SELECT email FROM users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%@example.com'
     OR email LIKE '%@test.com'
     OR created_at > NOW() - INTERVAL '7 days'
);

-- Soft delete test users (sets deleted_at timestamp)
UPDATE users
SET deleted_at = NOW()
WHERE (email LIKE '%test%' 
    OR email LIKE '%@example.com'
    OR email LIKE '%@test.com'
    OR created_at > NOW() - INTERVAL '7 days')
AND deleted_at IS NULL;

-- ============================================
-- 2. DELETE TEST BUSINESS USERS
-- ============================================
-- Delete test business users with similar criteria

DELETE FROM audit_logs
WHERE user_id IN (
  SELECT id FROM business_users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%@example.com'
     OR email LIKE '%@test.com'
     OR business_name LIKE '%Test%'
     OR business_name LIKE '%test%'
     OR created_at > NOW() - INTERVAL '7 days'
)
AND deleted_at IS NULL;

DELETE FROM otps
WHERE email IN (
  SELECT email FROM business_users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%@example.com'
     OR email LIKE '%@test.com'
     OR business_name LIKE '%Test%'
     OR business_name LIKE '%test%'
     OR created_at > NOW() - INTERVAL '7 days'
);

-- Soft delete test business users
UPDATE business_users
SET deleted_at = NOW()
WHERE (email LIKE '%test%' 
    OR email LIKE '%@example.com'
    OR email LIKE '%@test.com'
    OR business_name LIKE '%Test%'
    OR business_name LIKE '%test%'
    OR created_at > NOW() - INTERVAL '7 days')
AND deleted_at IS NULL;

-- ============================================
-- 3. CLEANUP OLD OTP RECORDS
-- ============================================
-- Delete expired OTPs older than 24 hours
DELETE FROM otps
WHERE expires_at < NOW() - INTERVAL '24 hours'
AND verified = FALSE;

-- ============================================
-- 4. CLEANUP OLD AUDIT LOGS (Optional)
-- ============================================
-- Delete audit logs older than 90 days (optional, uncomment if needed)
-- DELETE FROM audit_logs
-- WHERE created_at < NOW() - INTERVAL '90 days';

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================
-- Run these queries after cleanup to verify results:

-- Count remaining test users (should be 0 or minimal)
-- SELECT COUNT(*) as remaining_test_users
-- FROM users
-- WHERE (email LIKE '%test%' OR email LIKE '%@example.com' OR email LIKE '%@test.com')
-- AND deleted_at IS NULL;

-- Count remaining test business users (should be 0 or minimal)
-- SELECT COUNT(*) as remaining_test_business_users
-- FROM business_users
-- WHERE (email LIKE '%test%' OR email LIKE '%@example.com' OR email LIKE '%@test.com'
--     OR business_name LIKE '%Test%' OR business_name LIKE '%test%')
-- AND deleted_at IS NULL;

-- Count remaining OTPs
-- SELECT COUNT(*) as remaining_otps FROM otps;

COMMIT;

-- ============================================
-- NOTES
-- ============================================
-- 1. This script uses soft deletes (sets deleted_at) for users and business_users
-- 2. Hard deletes are used for related data (audit_logs, otps)
-- 3. Modify the WHERE clauses to match your specific test data patterns
-- 4. The script uses transactions (BEGIN/COMMIT) for safety
-- 5. To rollback changes, use: ROLLBACK;
--
-- ============================================
-- CUSTOMIZATION OPTIONS
-- ============================================
-- To delete specific test users by email:
--   UPDATE users SET deleted_at = NOW() WHERE email = 'test@example.com';
--
-- To delete all users created in last 24 hours:
--   UPDATE users SET deleted_at = NOW() WHERE created_at > NOW() - INTERVAL '24 hours';
--
-- To permanently delete (hard delete) instead of soft delete:
--   DELETE FROM users WHERE ... (instead of UPDATE ... SET deleted_at)
--   Note: This will permanently remove records and cannot be undone

-- Final
BEGIN;

-- Replace emails with your test accounts
DELETE FROM audit_logs
WHERE user_id IN (
  SELECT id FROM users
  WHERE email IN (
    'test1@example.com',
    'test2@test.com',
    'dummy@test.com'
  )
);

DELETE FROM otps
WHERE email IN (
  'test1@example.com',
  'test2@test.com',
  'dummy@test.com'
);

DELETE FROM users
WHERE email IN (
  'test1@example.com',
  'test2@test.com',
  'dummy@test.com'
);

COMMIT;


-- business users
BEGIN;

-- Replace emails with your test accounts
DELETE FROM audit_logs
WHERE user_id IN (
  SELECT id FROM business_users
  WHERE email IN (
    'test1@example.com'
  )
);

DELETE FROM otps
WHERE email IN (
  'test1@example.com'
);

DELETE FROM business_users
WHERE email IN (
  'test1@example.com'
);

COMMIT;

