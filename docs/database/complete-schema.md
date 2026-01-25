# Complete Database Schema

**Last Updated:** January 2026

## Overview

The database uses PostgreSQL with UUID primary keys, soft deletes, and comprehensive indexing for performance.

## Tables

### 1. users
Member accounts table.

**Columns:**
- `id` (UUID, PK) - Primary key
- `email` (VARCHAR(255), UNIQUE, NOT NULL) - User email
- `name` (VARCHAR(100), NOT NULL) - Full name
- `phone` (VARCHAR(20), NOT NULL) - Phone number
- `country_code` (VARCHAR(5)) - Country code (default: +971)
- `password_hash` (VARCHAR(255), NOT NULL) - Bcrypt hashed password
- `avatar` (TEXT) - Avatar URL
- `location_lat` (DECIMAL(10,8)) - Latitude
- `location_lng` (DECIMAL(11,8)) - Longitude
- `location_address` (TEXT) - Address string
- `preferences_categories` (TEXT[]) - Preferred categories
- `preferences_price_range` (VARCHAR(10)) - Price range preference
- `email_verified` (BOOLEAN, DEFAULT FALSE)
- `phone_verified` (BOOLEAN, DEFAULT FALSE)
- `marketing_consent` (BOOLEAN, DEFAULT FALSE)
- `account_status` (VARCHAR(20)) - active, suspended, pending_verification
- `failed_login_attempts` (INTEGER, DEFAULT 0)
- `locked_until` (TIMESTAMP) - Account lock expiry
- `last_login` (TIMESTAMP)
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `updated_at` (TIMESTAMP, DEFAULT NOW())
- `deleted_at` (TIMESTAMP) - Soft delete

**Indexes:**
- `idx_users_email` - On email (where deleted_at IS NULL)
- `idx_users_phone` - On phone (where deleted_at IS NULL)
- `idx_users_account_status` - On account_status
- `idx_users_email_verified` - On email_verified

---

### 2. business_users
Business account table.

**Columns:**
- `id` (UUID, PK)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `business_name` (VARCHAR(200), NOT NULL)
- `owner_name` (VARCHAR(100), NOT NULL)
- `phone` (VARCHAR(20), NOT NULL)
- `country_code` (VARCHAR(5))
- `password_hash` (VARCHAR(255), NOT NULL)
- `avatar` (TEXT)
- `business_type` (VARCHAR(20)) - gym, coaching, library
- `registration_number` (VARCHAR(50), NOT NULL)
- `years_in_operation` (VARCHAR(50))
- `website` (TEXT)
- `address_street` (VARCHAR(255), NOT NULL)
- `address_city` (VARCHAR(100), NOT NULL)
- `address_state` (VARCHAR(100), NOT NULL)
- `address_postal_code` (VARCHAR(20), NOT NULL)
- `address_country` (VARCHAR(100), DEFAULT 'UAE')
- `address_lat` (DECIMAL(10,8))
- `address_lng` (DECIMAL(11,8))
- `number_of_locations` (VARCHAR(50))
- `total_capacity` (INTEGER)
- `specialties` (TEXT[]) - Type-specific specialties
- `service_areas` (TEXT)
- `account_manager_email` (VARCHAR(255))
- `subscription_tier` (VARCHAR(20)) - starter, growth, enterprise
- `subscription_status` (VARCHAR(20)) - active, trial, expired
- `email_verified` (BOOLEAN, DEFAULT FALSE)
- `phone_verified` (BOOLEAN, DEFAULT FALSE)
- `business_verified` (BOOLEAN, DEFAULT FALSE)
- `verification_status` (VARCHAR(20)) - pending, verified, rejected
- `account_status` (VARCHAR(20)) - active, suspended, pending_verification
- `failed_login_attempts` (INTEGER, DEFAULT 0)
- `locked_until` (TIMESTAMP)
- `last_login` (TIMESTAMP)
- `is_published` (BOOLEAN, DEFAULT FALSE)
- `published_at` (TIMESTAMP)
- `daily_package_price` (DECIMAL(10,2), DEFAULT 299)
- `weekly_package_price` (DECIMAL(10,2), DEFAULT 1499)
- `monthly_package_price` (DECIMAL(10,2), DEFAULT 4999)
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `updated_at` (TIMESTAMP, DEFAULT NOW())
- `deleted_at` (TIMESTAMP)

**Indexes:**
- `idx_business_users_email`
- `idx_business_users_phone`
- `idx_business_users_account_status`
- `idx_business_users_business_type`
- `idx_business_users_verification_status`

---

### 3. venues
Venues (gyms, coaching centers, libraries) table.

**Columns:**
- `id` (UUID, PK)
- `business_user_id` (UUID, FK → business_users.id, CASCADE DELETE)
- `name` (VARCHAR(200), NOT NULL)
- `category` (VARCHAR(20), NOT NULL) - gym, coaching, library
- `description` (TEXT)
- `image` (TEXT)
- `rating` (DECIMAL(3,2), DEFAULT 0.0) - 0-5
- `reviews_count` (INTEGER, DEFAULT 0)
- `price` (DECIMAL(10,2), NOT NULL, DEFAULT 0)
- `price_label` (VARCHAR(50))
- `location_lat` (DECIMAL(10,8), NOT NULL)
- `location_lng` (DECIMAL(11,8), NOT NULL)
- `location_address` (TEXT, NOT NULL)
- `location_city` (VARCHAR(100), NOT NULL)
- `amenities` (TEXT[]) - Array of amenities
- `status` (VARCHAR(20)) - available, filling, full
- `occupancy` (INTEGER, DEFAULT 0)
- `capacity` (INTEGER, NOT NULL, DEFAULT 100)
- `verified` (BOOLEAN, DEFAULT FALSE)
- `open_now` (BOOLEAN, DEFAULT TRUE)
- `attributes` (JSONB) - Type-specific attributes
- `operating_hours` (JSONB) - Operating hours
- `is_published` (BOOLEAN, DEFAULT FALSE)
- `published_at` (TIMESTAMP)
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `updated_at` (TIMESTAMP, DEFAULT NOW())
- `deleted_at` (TIMESTAMP)

**Indexes:**
- `idx_venues_business_user_id`
- `idx_venues_category`
- `idx_venues_city`
- `idx_venues_location` (GIST index for geospatial queries)
- `idx_venues_status`
- `idx_venues_verified`
- `idx_venues_published`

**Triggers:**
- Auto-update `rating` and `reviews_count` when reviews are added/updated/deleted

---

### 4. bookings
User bookings table.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, CASCADE DELETE)
- `venue_id` (UUID, FK → venues.id, CASCADE DELETE)
- `venue_type` (VARCHAR(20), NOT NULL) - gym, coaching, library
- `booking_date` (DATE, NOT NULL)
- `booking_time` (TIME, NOT NULL)
- `duration` (INTEGER, NOT NULL, DEFAULT 60) - minutes
- `status` (VARCHAR(20)) - pending, confirmed, cancelled, completed, no_show
- `total_price` (DECIMAL(10,2), DEFAULT 0)
- `attendees` (INTEGER, DEFAULT 1)
- `special_requests` (TEXT)
- `payment_status` (VARCHAR(20)) - pending, paid, refunded, failed
- `payment_id` (VARCHAR(100))
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `updated_at` (TIMESTAMP, DEFAULT NOW())
- `cancelled_at` (TIMESTAMP)
- `cancelled_reason` (TEXT)

**Indexes:**
- `idx_bookings_user_id`
- `idx_bookings_venue_id`
- `idx_bookings_date`
- `idx_bookings_status`
- `idx_bookings_venue_date_time` (Composite index)

**Triggers:**
- Auto-update schedule availability when booking status changes

---

### 5. reviews
Venue reviews table.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, CASCADE DELETE)
- `venue_id` (UUID, FK → venues.id, CASCADE DELETE)
- `booking_id` (UUID, FK → bookings.id, SET NULL)
- `rating` (INTEGER, NOT NULL) - 1-5
- `comment` (TEXT)
- `helpful_count` (INTEGER, DEFAULT 0)
- `business_reply` (TEXT)
- `business_reply_date` (TIMESTAMP)
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `updated_at` (TIMESTAMP, DEFAULT NOW())
- `deleted_at` (TIMESTAMP)

**Constraints:**
- UNIQUE(user_id, venue_id) - One review per user per venue

**Indexes:**
- `idx_reviews_venue_id`
- `idx_reviews_user_id`
- `idx_reviews_rating`

**Triggers:**
- Auto-update venue rating when review is added/updated/deleted

---

### 6. favorites
User favorites table.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, CASCADE DELETE)
- `venue_id` (UUID, FK → venues.id, CASCADE DELETE)
- `created_at` (TIMESTAMP, DEFAULT NOW())

**Constraints:**
- UNIQUE(user_id, venue_id)

**Indexes:**
- `idx_favorites_user_id`
- `idx_favorites_venue_id`

---

### 7. notifications
Notifications table.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL) - Can be user or business_user
- `user_type` (VARCHAR(20), NOT NULL) - normal, business
- `type` (VARCHAR(50), NOT NULL) - Notification type
- `title` (VARCHAR(200), NOT NULL)
- `message` (TEXT, NOT NULL)
- `related_entity` (JSONB) - Related entity data
- `action_url` (TEXT)
- `action_label` (VARCHAR(100))
- `priority` (VARCHAR(20)) - high, medium, low
- `read` (BOOLEAN, DEFAULT FALSE)
- `delivery_channels` (TEXT[]) - in_app, email, sms
- `delivery_status` (JSONB) - Delivery status per channel
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `read_at` (TIMESTAMP)

**Indexes:**
- `idx_notifications_user_id` (Composite: user_id, user_type)
- `idx_notifications_read` (Partial: where read = FALSE)
- `idx_notifications_created_at` (DESC)

---

### 8. payments
Payment transactions table.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, CASCADE DELETE)
- `booking_id` (UUID, FK → bookings.id, SET NULL)
- `venue_id` (UUID, FK → venues.id, SET NULL)
- `amount` (DECIMAL(10,2), NOT NULL)
- `currency` (VARCHAR(3), DEFAULT 'INR')
- `payment_method` (VARCHAR(50), NOT NULL)
- `payment_status` (VARCHAR(20), NOT NULL) - pending, completed, failed, refunded
- `payment_gateway` (VARCHAR(50))
- `transaction_id` (VARCHAR(100))
- `gateway_response` (JSONB)
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `completed_at` (TIMESTAMP)
- `refunded_at` (TIMESTAMP)

**Indexes:**
- `idx_payments_user_id`
- `idx_payments_booking_id`
- `idx_payments_status`

---

### 9. memberships
User memberships table.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, CASCADE DELETE)
- `venue_id` (UUID, FK → venues.id, CASCADE DELETE)
- `business_user_id` (UUID, FK → business_users.id, CASCADE DELETE)
- `membership_type` (VARCHAR(50), NOT NULL) - daily, weekly, monthly, annual
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE, NOT NULL)
- `price` (DECIMAL(10,2), NOT NULL)
- `status` (VARCHAR(20)) - active, expired, cancelled
- `auto_renew` (BOOLEAN, DEFAULT FALSE)
- `payment_id` (UUID, FK → payments.id, SET NULL)
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `updated_at` (TIMESTAMP, DEFAULT NOW())

**Indexes:**
- `idx_memberships_user_id`
- `idx_memberships_venue_id`
- `idx_memberships_status`

---

### 10. business_members
Business members assignment table.

**Columns:**
- `id` (UUID, PK)
- `business_user_id` (UUID, FK → business_users.id, CASCADE DELETE)
- `user_id` (UUID, FK → users.id, CASCADE DELETE)
- `membership_id` (UUID, FK → memberships.id, SET NULL)
- `assigned_at` (TIMESTAMP, DEFAULT NOW())
- `notes` (TEXT)
- `status` (VARCHAR(20)) - active, inactive, suspended

**Constraints:**
- UNIQUE(business_user_id, user_id)

**Indexes:**
- `idx_business_members_business_id`
- `idx_business_members_user_id`

---

### 11. schedules
Venue availability schedule table.

**Columns:**
- `id` (UUID, PK)
- `venue_id` (UUID, FK → venues.id, CASCADE DELETE)
- `date` (DATE, NOT NULL)
- `time_slot` (TIME, NOT NULL)
- `duration` (INTEGER, DEFAULT 60) - minutes
- `total_slots` (INTEGER, NOT NULL, DEFAULT 15)
- `booked_slots` (INTEGER, DEFAULT 0)
- `available_slots` (INTEGER, GENERATED) - total_slots - booked_slots
- `is_available` (BOOLEAN, DEFAULT TRUE)
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `updated_at` (TIMESTAMP, DEFAULT NOW())

**Constraints:**
- UNIQUE(venue_id, date, time_slot)

**Indexes:**
- `idx_schedules_venue_id`
- `idx_schedules_date`
- `idx_schedules_venue_date` (Composite)

**Triggers:**
- Auto-update when bookings are created/updated/cancelled

---

### 12. otps
OTP codes for email verification and password reset.

**Columns:**
- `id` (UUID, PK)
- `email` (VARCHAR(255), NOT NULL)
- `otp_code` (VARCHAR(10), NOT NULL)
- `otp_type` (VARCHAR(20), NOT NULL) - email_verification, password_reset
- `expires_at` (TIMESTAMP, NOT NULL)
- `attempts` (INTEGER, DEFAULT 0)
- `verified` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMP, DEFAULT NOW())

**Indexes:**
- `idx_otps_email`
- `idx_otps_email_type` (Composite)
- `idx_otps_expires_at`

---

### 13. audit_logs
Audit trail for important actions.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID)
- `user_type` (VARCHAR(20)) - user, business_user, admin
- `action` (VARCHAR(50), NOT NULL)
- `resource_type` (VARCHAR(50))
- `resource_id` (UUID)
- `ip_address` (VARCHAR(45))
- `user_agent` (TEXT)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP, DEFAULT NOW())

**Indexes:**
- `idx_audit_logs_user_id`
- `idx_audit_logs_action`
- `idx_audit_logs_created_at`

---

## Relationships

```
users (1) ──< (N) bookings
users (1) ──< (N) reviews
users (1) ──< (N) favorites
users (1) ──< (N) payments
users (1) ──< (N) memberships

business_users (1) ──< (N) venues
business_users (1) ──< (N) business_members

venues (1) ──< (N) bookings
venues (1) ──< (N) reviews
venues (1) ──< (N) schedules
venues (1) ──< (N) memberships

bookings (1) ──< (0..1) reviews
bookings (1) ──< (0..1) payments
```

---

## Database Functions & Triggers

### update_updated_at_column()
Automatically updates `updated_at` timestamp on row update.

### update_venue_rating()
Automatically recalculates venue rating when reviews change.

### update_schedule_availability()
Automatically updates schedule availability when bookings change.

---

## Migration Files

1. `001_initial_schema.sql` - Users, business_users, otps, audit_logs
2. `002_venues_and_bookings_schema.sql` - All remaining tables

---

**For ERD diagram, see database documentation folder.**
