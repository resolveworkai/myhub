-- Migration: Create business_appointments_standalone table for business-managed appointments
-- Date: 2026-01-30
-- Description: Table for business-added appointments without direct user table relationship

CREATE TABLE IF NOT EXISTS business_appointments_standalone (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_user_id UUID NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  member_id UUID REFERENCES business_members_standalone(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- minutes
  attendees INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  special_requests TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancelled_reason TEXT,
  deleted_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_appointments_business_user_id ON business_appointments_standalone(business_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_appointments_venue_id ON business_appointments_standalone(venue_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_appointments_member_id ON business_appointments_standalone(member_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_appointments_date ON business_appointments_standalone(appointment_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_appointments_status ON business_appointments_standalone(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_appointments_date_time ON business_appointments_standalone(appointment_date, appointment_time) WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON TABLE business_appointments_standalone IS 'Stores appointments added by business users without requiring user authentication';
COMMENT ON COLUMN business_appointments_standalone.member_id IS 'Optional reference to business_members_standalone if appointment is for an existing member';
