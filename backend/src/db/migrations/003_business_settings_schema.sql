-- Migration: Add business settings columns
-- Date: 2026-01-26
-- Description: Add columns for business settings (operating hours, media, notifications, security, attributes)

-- Add new columns to business_users table
ALTER TABLE business_users
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS logo TEXT,
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "emailBookings": true,
  "emailPayments": true,
  "emailReminders": true,
  "smsBookings": false,
  "smsPayments": true,
  "pushNotifications": true
}',
ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{
  "twoFactor": false,
  "sessionTimeout": "30"
}',
ADD COLUMN IF NOT EXISTS business_attributes JSONB DEFAULT '{}';

-- Create index for published businesses
CREATE INDEX IF NOT EXISTS idx_business_users_published ON business_users(is_published) WHERE deleted_at IS NULL AND is_published = TRUE;

-- Add comment to columns
COMMENT ON COLUMN business_users.description IS 'Business description/service areas';
COMMENT ON COLUMN business_users.operating_hours IS 'Operating hours for each day of the week (JSONB)';
COMMENT ON COLUMN business_users.logo IS 'Business logo URL';
COMMENT ON COLUMN business_users.cover_image IS 'Business cover image URL';
COMMENT ON COLUMN business_users.gallery_images IS 'Array of gallery image URLs';
COMMENT ON COLUMN business_users.notification_preferences IS 'Notification preferences (JSONB)';
COMMENT ON COLUMN business_users.security_settings IS 'Security settings including 2FA and session timeout (JSONB)';
COMMENT ON COLUMN business_users.business_attributes IS 'Business-specific attributes (amenities, equipment, etc.) stored as JSONB';
