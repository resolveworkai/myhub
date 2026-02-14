-- Migration: Add notification preferences to users table
-- Date: 2026-01-26
-- Description: Add notification_preferences JSONB column to users table for storing user notification settings

-- Add notification_preferences column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "emailBookings": true,
  "emailPayments": true,
  "emailReminders": true,
  "smsBookings": false,
  "smsPayments": true,
  "pushNotifications": true
}';

-- Add comment
COMMENT ON COLUMN users.notification_preferences IS 'User notification preferences (JSONB)';
