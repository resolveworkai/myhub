-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Member accounts)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  country_code VARCHAR(5) DEFAULT '+971',
  password_hash VARCHAR(255) NOT NULL,
  avatar TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  preferences_categories TEXT[] DEFAULT '{}',
  preferences_price_range VARCHAR(10) DEFAULT '$$',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_verification')),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Business users table
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  business_name VARCHAR(200) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  country_code VARCHAR(5) DEFAULT '+971',
  password_hash VARCHAR(255) NOT NULL,
  avatar TEXT,
  business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('gym', 'coaching', 'library')),
  registration_number VARCHAR(50) NOT NULL,
  years_in_operation VARCHAR(50),
  website TEXT,
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(100) NOT NULL,
  address_postal_code VARCHAR(20) NOT NULL,
  address_country VARCHAR(100) DEFAULT 'UAE',
  address_lat DECIMAL(10, 8),
  address_lng DECIMAL(11, 8),
  number_of_locations VARCHAR(50),
  total_capacity INTEGER,
  specialties TEXT[] DEFAULT '{}',
  service_areas TEXT,
  account_manager_email VARCHAR(255),
  subscription_tier VARCHAR(20) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'growth', 'enterprise')),
  subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired')),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  business_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  account_status VARCHAR(20) DEFAULT 'pending_verification' CHECK (account_status IN ('active', 'suspended', 'pending_verification')),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login TIMESTAMP,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  daily_package_price DECIMAL(10, 2) DEFAULT 299,
  weekly_package_price DECIMAL(10, 2) DEFAULT 1499,
  monthly_package_price DECIMAL(10, 2) DEFAULT 4999,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- OTP table for email verification and password reset
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  otp_type VARCHAR(20) NOT NULL CHECK (otp_type IN ('email_verification', 'password_reset')),
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_type VARCHAR(20) CHECK (user_type IN ('user', 'business_user', 'admin')),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_business_users_email ON business_users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_users_phone ON business_users(phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_users_account_status ON business_users(account_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_users_business_type ON business_users(business_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_users_verification_status ON business_users(verification_status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
CREATE INDEX IF NOT EXISTS idx_otps_email_type ON otps(email, otp_type);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_users_updated_at BEFORE UPDATE ON business_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
