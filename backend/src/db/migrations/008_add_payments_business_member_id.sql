-- Migration: Add business_member_id to payments
-- Date: 2026-02-05
-- Description: Add a reliable FK to link payments to business_members_standalone

BEGIN;

-- 1️⃣ Add column
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS business_member_id UUID
REFERENCES business_members_standalone(id) ON DELETE SET NULL;

-- 2️⃣ Index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_business_member_id
ON payments(business_member_id);

-- 3️⃣ Backfill existing payments using member_email + venue → business mapping
UPDATE payments p
SET business_member_id = bms.id
FROM business_members_standalone bms,
     venues v
WHERE p.member_email IS NOT NULL
  AND p.business_member_id IS NULL
  AND p.venue_id = v.id
  AND bms.email = p.member_email
  AND bms.business_user_id = v.business_user_id
  AND bms.deleted_at IS NULL;

-- 4️⃣ Comment
COMMENT ON COLUMN payments.business_member_id IS
'Reference to business_members_standalone when payment is for a standalone member (reliable linkage instead of member_email)';

COMMIT;
