# Database Schema Documentation

**Last Updated:** January 25, 2026

## Overview

The database uses PostgreSQL with the following main tables:
- `users` - Member accounts
- `business_users` - Business accounts
- `otps` - One-time passwords for email verification and password reset
- `audit_logs` - Audit trail for critical operations

## Tables

### users

Member/user accounts table.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email address (lowercase) |
| name | VARCHAR(100) | NOT NULL | User full name |
| phone | VARCHAR(20) | NOT NULL | User phone number |
| country_code | VARCHAR(5) | DEFAULT '+971' | Country code |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| avatar | TEXT | | Avatar URL |
| location_lat | DECIMAL(10, 8) | | Location latitude |
| location_lng | DECIMAL(11, 8) | | Location longitude |
| location_address | TEXT | | Location address string |
| preferences_categories | TEXT[] | DEFAULT '{}' | Preferred categories array |
| preferences_price_range | VARCHAR(10) | DEFAULT '$$' | Price range preference |
| email_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| phone_verified | BOOLEAN | DEFAULT FALSE | Phone verification status |
| marketing_consent | BOOLEAN | DEFAULT FALSE | Marketing consent |
| account_status | VARCHAR(20) | DEFAULT 'active', CHECK | Account status: active, suspended, pending_verification |
| failed_login_attempts | INTEGER | DEFAULT 0 | Failed login attempts counter |
| locked_until | TIMESTAMP | | Account lock expiration time |
| last_login | TIMESTAMP | | Last login timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Indexes:**
- `idx_users_email` - On `email` WHERE `deleted_at IS NULL`
- `idx_users_phone` - On `phone` WHERE `deleted_at IS NULL`
- `idx_users_account_status` - On `account_status` WHERE `deleted_at IS NULL`
- `idx_users_email_verified` - On `email_verified` WHERE `deleted_at IS NULL`

---

### business_users

Business accounts table.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique business identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Business email address |
| business_name | VARCHAR(200) | NOT NULL | Business name |
| owner_name | VARCHAR(100) | NOT NULL | Owner/manager name |
| phone | VARCHAR(20) | NOT NULL | Business phone number |
| country_code | VARCHAR(5) | DEFAULT '+971' | Country code |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| avatar | TEXT | | Business avatar/logo URL |
| business_type | VARCHAR(20) | NOT NULL, CHECK | Type: gym, coaching, library |
| registration_number | VARCHAR(50) | NOT NULL | Business registration number |
| years_in_operation | VARCHAR(50) | | Years in operation |
| website | TEXT | | Business website URL |
| address_street | VARCHAR(255) | NOT NULL | Street address |
| address_city | VARCHAR(100) | NOT NULL | City |
| address_state | VARCHAR(100) | NOT NULL | State/Emirate |
| address_postal_code | VARCHAR(20) | NOT NULL | Postal code |
| address_country | VARCHAR(100) | DEFAULT 'UAE' | Country |
| address_lat | DECIMAL(10, 8) | | Address latitude |
| address_lng | DECIMAL(11, 8) | | Address longitude |
| number_of_locations | VARCHAR(50) | | Number of locations |
| total_capacity | INTEGER | | Total capacity |
| specialties | TEXT[] | DEFAULT '{}' | Business specialties array |
| service_areas | TEXT | | Service areas description |
| account_manager_email | VARCHAR(255) | | Account manager email |
| subscription_tier | VARCHAR(20) | DEFAULT 'starter', CHECK | Tier: starter, growth, enterprise |
| subscription_status | VARCHAR(20) | DEFAULT 'active', CHECK | Status: active, trial, expired |
| email_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| phone_verified | BOOLEAN | DEFAULT FALSE | Phone verification status |
| business_verified | BOOLEAN | DEFAULT FALSE | Business verification status |
| verification_status | VARCHAR(20) | DEFAULT 'pending', CHECK | Status: pending, verified, rejected |
| account_status | VARCHAR(20) | DEFAULT 'pending_verification', CHECK | Account status |
| failed_login_attempts | INTEGER | DEFAULT 0 | Failed login attempts |
| locked_until | TIMESTAMP | | Account lock expiration |
| last_login | TIMESTAMP | | Last login timestamp |
| is_published | BOOLEAN | DEFAULT FALSE | Published status |
| published_at | TIMESTAMP | | Publication timestamp |
| daily_package_price | DECIMAL(10, 2) | DEFAULT 299 | Daily package price |
| weekly_package_price | DECIMAL(10, 2) | DEFAULT 1499 | Weekly package price |
| monthly_package_price | DECIMAL(10, 2) | DEFAULT 4999 | Monthly package price |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Indexes:**
- `idx_business_users_email` - On `email` WHERE `deleted_at IS NULL`
- `idx_business_users_phone` - On `phone` WHERE `deleted_at IS NULL`
- `idx_business_users_account_status` - On `account_status` WHERE `deleted_at IS NULL`
- `idx_business_users_business_type` - On `business_type` WHERE `deleted_at IS NULL`
- `idx_business_users_verification_status` - On `verification_status` WHERE `deleted_at IS NULL`

---

### otps

One-time passwords for email verification and password reset.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique OTP identifier |
| email | VARCHAR(255) | NOT NULL | Email address |
| otp_code | VARCHAR(10) | NOT NULL | OTP code (6 digits) |
| otp_type | VARCHAR(20) | NOT NULL, CHECK | Type: email_verification, password_reset |
| expires_at | TIMESTAMP | NOT NULL | Expiration timestamp |
| attempts | INTEGER | DEFAULT 0 | Verification attempts |
| verified | BOOLEAN | DEFAULT FALSE | Verification status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes:**
- `idx_otps_email` - On `email`
- `idx_otps_email_type` - On `(email, otp_type)`
- `idx_otps_expires_at` - On `expires_at`

---

### audit_logs

Audit trail for critical operations.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique log identifier |
| user_id | UUID | | User ID (nullable) |
| user_type | VARCHAR(20) | CHECK | Type: user, business_user, admin |
| action | VARCHAR(50) | NOT NULL | Action performed |
| resource_type | VARCHAR(50) | | Resource type |
| resource_id | UUID | | Resource ID |
| ip_address | VARCHAR(45) | | IP address |
| user_agent | TEXT | | User agent string |
| metadata | JSONB | | Additional metadata |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes:**
- `idx_audit_logs_user_id` - On `user_id`
- `idx_audit_logs_action` - On `action`
- `idx_audit_logs_created_at` - On `created_at`

---

## Relationships

### users
- No foreign keys (standalone table)

### business_users
- No foreign keys (standalone table)

### otps
- No foreign keys (email reference only)

### audit_logs
- No foreign keys (user_id reference only)

## Triggers

### update_updated_at_column()

Automatically updates `updated_at` timestamp on row updates.

Applied to:
- `users`
- `business_users`

## Constraints

### Check Constraints

- `users.account_status` - Must be one of: active, suspended, pending_verification
- `business_users.business_type` - Must be one of: gym, coaching, library
- `business_users.subscription_tier` - Must be one of: starter, growth, enterprise
- `business_users.subscription_status` - Must be one of: active, trial, expired
- `business_users.verification_status` - Must be one of: pending, verified, rejected
- `business_users.account_status` - Must be one of: active, suspended, pending_verification
- `otps.otp_type` - Must be one of: email_verification, password_reset

### Unique Constraints

- `users.email` - Unique (with soft delete check)
- `business_users.email` - Unique (with soft delete check)

## Soft Deletes

Both `users` and `business_users` tables support soft deletes via the `deleted_at` column. When a record is soft-deleted:
- The `deleted_at` timestamp is set
- The record is excluded from normal queries (via WHERE `deleted_at IS NULL`)
- Indexes respect the soft delete status

## Migrations

Migrations are located in `src/db/migrations/`.

To run migrations:
```bash
npm run migrate
```

Or manually:
```bash
psql -U postgres -d portal_db -f src/db/migrations/001_initial_schema.sql
```
