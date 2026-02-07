-- Migration: Add overdue status to business_members_standalone
-- Date: 2026-01-27
-- Description: Add 'overdue' status to the status constraint to support memberships that have expired but are within the 7-day grace period

-- Drop the existing constraint
ALTER TABLE business_members_standalone
DROP CONSTRAINT IF EXISTS business_members_standalone_status_check;

-- Add the new constraint with overdue status
ALTER TABLE business_members_standalone
ADD CONSTRAINT business_members_standalone_status_check 
CHECK (status IN ('active', 'expired', 'cancelled', 'overdue'));

-- Add comment
COMMENT ON COLUMN business_members_standalone.status IS 'Membership status: active (valid), expired (ended >7 days ago), overdue (ended within last 7 days), cancelled (manually cancelled)';
