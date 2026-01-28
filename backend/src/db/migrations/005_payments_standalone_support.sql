-- Migration: Add support for standalone payments (not linked to users table)
-- Created: 2026-01-26
-- Description: Make user_id nullable in payments table to support business-added payments

-- Make user_id nullable in payments table
ALTER TABLE payments
ALTER COLUMN user_id DROP NOT NULL;

-- Add member_name and member_email columns for standalone payments
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS member_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS member_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS member_phone VARCHAR(20);

-- Add index for member_email
CREATE INDEX IF NOT EXISTS idx_payments_member_email ON payments(member_email) WHERE member_email IS NOT NULL;

-- Add comment
COMMENT ON COLUMN payments.user_id IS 'User ID if payment is linked to a registered user, NULL for standalone payments';
COMMENT ON COLUMN payments.member_name IS 'Member name for standalone payments (when user_id is NULL)';
COMMENT ON COLUMN payments.member_email IS 'Member email for standalone payments (when user_id is NULL)';
