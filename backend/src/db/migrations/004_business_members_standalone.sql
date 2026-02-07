-- Migration: Create standalone business_members table for business-added members
-- This table stores members added by business users without requiring user authentication
-- Created: 2026-01-26

-- Create business_members_standalone table
CREATE TABLE IF NOT EXISTS business_members_standalone (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_user_id UUID NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  membership_type VARCHAR(50) NOT NULL CHECK (membership_type IN ('daily', 'weekly', 'monthly')),
  price DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  notes TEXT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create indexes for performance (optimized for common queries)
CREATE INDEX IF NOT EXISTS idx_business_members_standalone_business_user_id ON business_members_standalone(business_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_members_standalone_venue_id ON business_members_standalone(venue_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_members_standalone_email ON business_members_standalone(email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_members_standalone_status ON business_members_standalone(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_members_standalone_membership_type ON business_members_standalone(membership_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_members_standalone_business_status ON business_members_standalone(business_user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_members_standalone_business_type ON business_members_standalone(business_user_id, membership_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_members_standalone_end_date ON business_members_standalone(end_date) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON TABLE business_members_standalone IS 'Stores members added by business users without requiring user authentication';
