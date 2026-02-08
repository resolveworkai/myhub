-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Pass configurations table (for pass management)
CREATE TABLE IF NOT EXISTS pass_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  pass_type VARCHAR(50) NOT NULL CHECK (pass_type IN ('daily', 'weekly', 'monthly', 'custom')),
  duration_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_users_account_status ON admin_users(account_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pass_configurations_pass_type ON pass_configurations(pass_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pass_configurations_is_active ON pass_configurations(is_active) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);

-- Trigger for updated_at on admin_users
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on pass_configurations
CREATE TRIGGER update_pass_configurations_updated_at BEFORE UPDATE ON pass_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on platform_settings
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
