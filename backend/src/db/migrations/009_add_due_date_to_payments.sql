-- Migration: Add due_date column to payments table
-- Date: 2026-02-07
-- Description: Add due_date to track payment due dates for membership payments

BEGIN;

-- Add due_date column for tracking when payment is due
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'other';

-- Add index for due_date queries
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

-- Add comments
COMMENT ON COLUMN payments.due_date IS 'Due date for the payment (typically end_date of membership + 1 day for memberships)';
COMMENT ON COLUMN payments.payment_type IS 'Type of payment: membership, session, product, or other';

COMMIT;
