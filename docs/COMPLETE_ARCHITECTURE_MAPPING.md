# MyHub Complete Architecture Mapping

**Document Version:** 1.0  
**Created:** February 2026  
**Purpose:** Complete database schema, API endpoints, and data flow documentation for creating architecture diagrams

---

## 📊 Table of Contents

1. [Database Tables Overview](#database-tables-overview)
2. [Table Relationships & Entity Relationships](#table-relationships--entity-relationships)
3. [API Endpoints by Module](#api-endpoints-by-module)
4. [CRUD Operations Mapping](#crud-operations-mapping)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Frontend to Backend API Calls](#frontend-to-backend-api-calls)

---

## 🗄️ Database Tables Overview

### Core Tables

| Table Name | Purpose | Owner | Relations |
|-----------|---------|-------|-----------|
| `users` | Regular member/customer accounts | Members | 1 → N bookings, reviews, favorites, payments, memberships |
| `business_users` | Business account (gym, coaching, library) | Businesses | 1 → N venues, business_members |
| `venues` | Specific gym/coaching center/library location | Business | N ← 1 business_users; 1 → N bookings, reviews, schedules, memberships |
| `bookings` | User venue reservations | Users | N ← 1 users; N ← 1 venues; 1 → 0..1 reviews; 1 → 0..1 payments |
| `reviews` | User reviews of venues | Users | N ← 1 users; N ← 1 venues; 0..1 ← 1 bookings |
| `favorites` | User favorite venues | Users | N ← 1 users; N ← 1 venues |
| `notifications` | System notifications for users & businesses | System | N ← 1 users (polymorphic) |
| `payments` | Payment transactions | System | N ← 1 users; 0..1 ← 1 bookings; 0..1 ← 1 venues |
| `memberships` | User memberships at venues | Venues | N ← 1 users; N ← 1 venues; N ← 1 business_users; 0..1 ← 1 payments |
| `business_members` | Members assigned to a business | Businesses | N ← 1 business_users; N ← 1 users; 0..1 ← 1 memberships |
| `schedules` | Venue time slot availability | Venues | N ← 1 venues |
| `otps` | One-Time Passwords for verification | System | Email-based |
| `audit_logs` | Activity audit trail | System | Links to any user_id |

---

## 📋 Detailed Table Schemas

### 1️⃣ `users` Table
**Purpose:** Regular user/member accounts

**Columns:**
```
PK: id (UUID)
Unique: email, phone
- email (VARCHAR 255)
- name (VARCHAR 100)
- phone (VARCHAR 20)
- country_code (VARCHAR 5, default: +971)
- password_hash (VARCHAR 255, bcrypt)
- avatar (TEXT)
- location_lat (DECIMAL 10,8)
- location_lng (DECIMAL 11,8)
- location_address (TEXT)
- preferences_categories (TEXT[])
- preferences_price_range (VARCHAR 10)
- email_verified (BOOLEAN)
- phone_verified (BOOLEAN)
- marketing_consent (BOOLEAN)
- account_status (ENUM: active, suspended, pending_verification)
- failed_login_attempts (INTEGER)
- locked_until (TIMESTAMP)
- last_login (TIMESTAMP)
- created_at, updated_at, deleted_at (timestamps)
```

**Indexes:**
- `idx_users_email` (where deleted_at IS NULL)
- `idx_users_phone` (where deleted_at IS NULL)
- `idx_users_account_status`
- `idx_users_email_verified`

**Key Relationships:**
- 1 → N `bookings` (user creates bookings)
- 1 → N `reviews` (user writes reviews)
- 1 → N `favorites` (user adds favorites)
- 1 → N `payments` (user makes payments)
- 1 → N `memberships` (user has memberships)

---

### 2️⃣ `business_users` Table
**Purpose:** Business account management (gym, coaching, library)

**Columns:**
```
PK: id (UUID)
Unique: email
- email (VARCHAR 255)
- business_name (VARCHAR 200)
- owner_name (VARCHAR 100)
- phone (VARCHAR 20)
- country_code (VARCHAR 5)
- password_hash (VARCHAR 255)
- avatar (TEXT)
- business_type (ENUM: gym, coaching, library)
- registration_number (VARCHAR 50)
- years_in_operation (VARCHAR 50)
- website (TEXT)
- address_street (VARCHAR 255)
- address_city (VARCHAR 100)
- address_state (VARCHAR 100)
- address_postal_code (VARCHAR 20)
- address_country (VARCHAR 100, default: UAE)
- address_lat (DECIMAL 10,8)
- address_lng (DECIMAL 11,8)
- number_of_locations (VARCHAR 50)
- total_capacity (INTEGER)
- specialties (TEXT[])
- service_areas (TEXT)
- account_manager_email (VARCHAR 255)
- subscription_tier (ENUM: starter, growth, enterprise)
- subscription_status (ENUM: active, trial, expired)
- email_verified, phone_verified, business_verified (BOOLEAN)
- verification_status (ENUM: pending, verified, rejected)
- account_status (ENUM: active, suspended, pending_verification)
- failed_login_attempts (INTEGER)
- locked_until (TIMESTAMP)
- last_login (TIMESTAMP)
- is_published (BOOLEAN)
- published_at (TIMESTAMP)
- daily_package_price (DECIMAL 10,2, default: 299)
- weekly_package_price (DECIMAL 10,2, default: 1499)
- monthly_package_price (DECIMAL 10,2, default: 4999)
- created_at, updated_at, deleted_at (timestamps)
```

**Indexes:**
- `idx_business_users_email`
- `idx_business_users_phone`
- `idx_business_users_account_status`
- `idx_business_users_business_type`
- `idx_business_users_verification_status`

**Key Relationships:**
- 1 → N `venues` (business owns venues)
- 1 → N `business_members` (business has members)
- 1 → N `payments` (business receives payments)

---

### 3️⃣ `venues` Table
**Purpose:** Specific venue/location details (Gym, Coaching Center, Library)

**Columns:**
```
PK: id (UUID)
FK: business_user_id (CASCADE DELETE)
- name (VARCHAR 200)
- category (ENUM: gym, coaching, library)
- description (TEXT)
- image (TEXT)
- rating (DECIMAL 3,2, default: 0.0)
- reviews_count (INTEGER, default: 0)
- price (DECIMAL 10,2)
- price_label (VARCHAR 50)
- location_lat (DECIMAL 10,8, NOT NULL)
- location_lng (DECIMAL 11,8, NOT NULL)
- location_address (TEXT, NOT NULL)
- location_city (VARCHAR 100)
- amenities (TEXT[])
- status (ENUM: available, filling, full)
- occupancy (INTEGER, default: 0)
- capacity (INTEGER, default: 100)
- verified (BOOLEAN, default: FALSE)
- open_now (BOOLEAN, default: TRUE)
- attributes (JSONB) - Type-specific attributes
- operating_hours (JSONB) - Business hours per day
- is_published (BOOLEAN, default: FALSE)
- published_at (TIMESTAMP)
- created_at, updated_at, deleted_at (timestamps)
```

**Indexes:**
- `idx_venues_business_user_id`
- `idx_venues_category`
- `idx_venues_city`
- `idx_venues_location` (GIST for geospatial)
- `idx_venues_status`
- `idx_venues_verified`
- `idx_venues_published`

**Triggers:**
- Auto-update `rating` and `reviews_count` when reviews change

**Key Relationships:**
- N ← 1 `business_users` (venue belongs to business)
- 1 → N `bookings` (venue has bookings)
- 1 → N `reviews` (venue has reviews)
- 1 → N `schedules` (venue has time slots)
- 1 → N `memberships` (venue has members)

---

### 4️⃣ `bookings` Table
**Purpose:** Track user reservations at venues

**Columns:**
```
PK: id (UUID)
FK: user_id (CASCADE DELETE) → users
FK: venue_id (CASCADE DELETE) → venues
- venue_type (ENUM: gym, coaching, library)
- booking_date (DATE)
- booking_time (TIME)
- duration (INTEGER, default: 60) - minutes
- status (ENUM: pending, confirmed, cancelled, completed, no_show)
- total_price (DECIMAL 10,2, default: 0)
- attendees (INTEGER, default: 1)
- special_requests (TEXT)
- payment_status (ENUM: pending, paid, refunded, failed)
- payment_id (VARCHAR 100)
- created_at, updated_at (TIMESTAMP)
- cancelled_at (TIMESTAMP)
- cancelled_reason (TEXT)
```

**Indexes:**
- `idx_bookings_user_id`
- `idx_bookings_venue_id`
- `idx_bookings_date`
- `idx_bookings_status`
- `idx_bookings_venue_date_time` (Composite)

**Triggers:**
- Auto-update schedule availability when booking status changes

**Key Relationships:**
- N ← 1 `users` (booking belongs to user)
- N ← 1 `venues` (booking is for venue)
- 0..1 → 1 `reviews` (booking can have ONE review)
- 0..1 → 1 `payments` (booking can have ONE payment)

---

### 5️⃣ `reviews` Table
**Purpose:** User reviews and ratings for venues

**Columns:**
```
PK: id (UUID)
FK: user_id (CASCADE DELETE) → users
FK: venue_id (CASCADE DELETE) → venues
FK: booking_id (SET NULL) → bookings
- rating (INTEGER, 1-5)
- comment (TEXT)
- helpful_count (INTEGER, default: 0)
- business_reply (TEXT)
- business_reply_date (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP)
Constraint: UNIQUE(user_id, venue_id) - One review per user per venue
```

**Indexes:**
- `idx_reviews_venue_id`
- `idx_reviews_user_id`
- `idx_reviews_rating`

**Triggers:**
- Auto-update venue `rating` and `reviews_count` when review is added/updated/deleted

**Key Relationships:**
- N ← 1 `users` (review written by user)
- N ← 1 `venues` (review is for venue)
- 0..1 ← 1 `bookings` (review linked to booking)

---

### 6️⃣ `favorites` Table
**Purpose:** Track user favorite venues

**Columns:**
```
PK: id (UUID)
FK: user_id (CASCADE DELETE) → users
FK: venue_id (CASCADE DELETE) → venues
- created_at (TIMESTAMP)
Constraint: UNIQUE(user_id, venue_id)
```

**Indexes:**
- `idx_favorites_user_id`
- `idx_favorites_venue_id`

**Key Relationships:**
- N ← 1 `users` (favorite belongs to user)
- N ← 1 `venues` (venue is favorited)

---

### 7️⃣ `notifications` Table
**Purpose:** System notifications for users and businesses

**Columns:**
```
PK: id (UUID)
- user_id (UUID, NOT NULL) - Can be from users or business_users table
- user_type (ENUM: normal, business)
- type (VARCHAR 50) - Notification type
- title (VARCHAR 200)
- message (TEXT)
- related_entity (JSONB) - Linked entity data
- action_url (TEXT)
- action_label (VARCHAR 100)
- priority (ENUM: high, medium, low)
- read (BOOLEAN, default: FALSE)
- delivery_channels (TEXT[]) - in_app, email, sms
- delivery_status (JSONB) - Status per channel
- created_at (TIMESTAMP)
- read_at (TIMESTAMP)
```

**Indexes:**
- `idx_notifications_user_id` (Composite: user_id, user_type)
- `idx_notifications_read` (Partial: where read = FALSE)
- `idx_notifications_created_at` (DESC)

**Key Relationships:**
- Polymorphic: Links to either `users` OR `business_users`
- No child tables

---

### 8️⃣ `payments` Table
**Purpose:** Payment transaction records

**Columns:**
```
PK: id (UUID)
FK: user_id (CASCADE DELETE) → users
FK: booking_id (SET NULL) → bookings
FK: venue_id (SET NULL) → venues
- amount (DECIMAL 10,2)
- currency (VARCHAR 3, default: INR)
- payment_method (VARCHAR 50)
- payment_status (ENUM: pending, completed, failed, refunded)
- payment_gateway (VARCHAR 50)
- transaction_id (VARCHAR 100)
- gateway_response (JSONB)
- created_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- refunded_at (TIMESTAMP)
```

**Indexes:**
- `idx_payments_user_id`
- `idx_payments_booking_id`
- `idx_payments_status`

**Key Relationships:**
- N ← 1 `users` (payment made by user)
- 0..1 ← 1 `bookings` (payment for booking)
- 0..1 ← 1 `venues` (payment to venue)

---

### 9️⃣ `memberships` Table
**Purpose:** User memberships at specific venues

**Columns:**
```
PK: id (UUID)
FK: user_id (CASCADE DELETE) → users
FK: venue_id (CASCADE DELETE) → venues
FK: business_user_id (CASCADE DELETE) → business_users
- membership_type (ENUM: daily, weekly, monthly, annual)
- start_date (DATE)
- end_date (DATE)
- price (DECIMAL 10,2)
- status (ENUM: active, expired, cancelled)
- auto_renew (BOOLEAN, default: FALSE)
- payment_id (UUID, FK SET NULL) → payments
- created_at, updated_at (TIMESTAMP)
```

**Indexes:**
- `idx_memberships_user_id`
- `idx_memberships_venue_id`
- `idx_memberships_status`

**Key Relationships:**
- N ← 1 `users` (membership belongs to user)
- N ← 1 `venues` (membership at venue)
- N ← 1 `business_users` (membership to business)
- 0..1 ← 1 `payments` (membership payment)

---

### 🔟 `business_members` Table
**Purpose:** Assignment of users as members to a business

**Columns:**
```
PK: id (UUID)
FK: business_user_id (CASCADE DELETE) → business_users
FK: user_id (CASCADE DELETE) → users
- membership_id (UUID, FK SET NULL) → memberships
- assigned_at (TIMESTAMP)
- notes (TEXT)
- status (ENUM: active, inactive, suspended)
Constraint: UNIQUE(business_user_id, user_id)
```

**Indexes:**
- `idx_business_members_business_id`
- `idx_business_members_user_id`

**Key Relationships:**
- N ← 1 `business_users` (member assigned to business)
- N ← 1 `users` (user assigned as member)
- 0..1 ← 1 `memberships` (linked membership)

---

### 1️⃣1️⃣ `schedules` Table
**Purpose:** Venue time slot availability management

**Columns:**
```
PK: id (UUID)
FK: venue_id (CASCADE DELETE) → venues
- date (DATE)
- time_slot (TIME)
- duration (INTEGER, default: 60) - minutes
- total_slots (INTEGER, default: 15)
- booked_slots (INTEGER, default: 0)
- available_slots (INTEGER, GENERATED) - total_slots - booked_slots
- is_available (BOOLEAN, default: TRUE)
- created_at, updated_at (TIMESTAMP)
Constraint: UNIQUE(venue_id, date, time_slot)
```

**Indexes:**
- `idx_schedules_venue_id`
- `idx_schedules_date`
- `idx_schedules_venue_date` (Composite)

**Triggers:**
- Auto-update when bookings are created/updated/cancelled

**Key Relationships:**
- N ← 1 `venues` (schedule for venue)

---

### 1️⃣2️⃣ `otps` Table
**Purpose:** One-Time Passwords for email verification and password reset

**Columns:**
```
PK: id (UUID)
- email (VARCHAR 255)
- otp_code (VARCHAR 10)
- otp_type (ENUM: email_verification, password_reset)
- expires_at (TIMESTAMP)
- attempts (INTEGER, default: 0)
- verified (BOOLEAN, default: FALSE)
- created_at (TIMESTAMP)
```

**Indexes:**
- `idx_otps_email`
- `idx_otps_email_type` (Composite)
- `idx_otps_expires_at`

**Key Relationships:**
- No direct FKs (email-based)

---

### 1️⃣3️⃣ `audit_logs` Table
**Purpose:** Activity audit trail for security and compliance

**Columns:**
```
PK: id (UUID)
- user_id (UUID) - Optional
- user_type (ENUM: user, business_user, admin)
- action (VARCHAR 50) - The action performed
- resource_type (VARCHAR 50) - Type of resource affected
- resource_id (UUID) - ID of affected resource
- ip_address (VARCHAR 45)
- user_agent (TEXT)
- metadata (JSONB) - Additional context
- created_at (TIMESTAMP)
```

**Indexes:**
- `idx_audit_logs_user_id`
- `idx_audit_logs_action`
- `idx_audit_logs_created_at`

**Key Relationships:**
- No direct FKs (flexible linking)

---

## 🔗 Table Relationships & Entity Relationships Diagram

### ER Diagram (Text Format)

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                       │
└─────────────────────────────────────────────────────────────────┘

USERS ENTITY CLUSTER:
┌──────────────────────────────────────────────────────────────┐
│                       users (PK: id)                          │
│ ├── email, name, phone, location, preferences               │
│ └── account_status, email_verified, phone_verified           │
└──────────────────────────────────────────────────────────────┘
    │
    ├─── 1:N ──→ bookings (FK: user_id)
    │              ├─── 0..1:1 ──→ reviews
    │              ├─── 0..1:1 ──→ payments
    │              └─── Trigger: updates schedules
    │
    ├─── 1:N ──→ reviews (FK: user_id)
    │              └── Trigger: updates venues (rating, reviews_count)
    │
    ├─── 1:N ──→ favorites (FK: user_id)
    │
    ├─── 1:N ──→ payments (FK: user_id)
    │
    ├─── 1:N ──→ memberships (FK: user_id)
    │              └── Status tracking: active/expired/cancelled
    │
    └─── 1:N ──→ business_members (FK: user_id)
                   └── Assignment relation to business_users


BUSINESS ENTITY CLUSTER:
┌──────────────────────────────────────────────────────────────┐
│              business_users (PK: id)                          │
│ ├── business_name, business_type, verification_status       │
│ ├── subscription_tier, subscription_status                  │
│ └── pricing (daily, weekly, monthly packages)               │
└──────────────────────────────────────────────────────────────┘
    │
    ├─── 1:N ──→ venues (FK: business_user_id) [CASCADE DELETE]
    │              ├─── Trigger: auto-updates rating
    │              ├─── 1:N ──→ bookings
    │              ├─── 1:N ──→ reviews
    │              ├─── 1:N ──→ schedules
    │              └─── 1:N ──→ memberships
    │
    ├─── 1:N ──→ business_members (FK: business_user_id)
    │              ├─── Links to users (FK: user_id)
    │              └─── Links to memberships (FK: membership_id)
    │
    └─── 1:N ──→ memberships (FK: business_user_id)


VENUE ENTITY CLUSTER:
┌──────────────────────────────────────────────────────────────┐
│                  venues (PK: id)                              │
│ ├── name, category, location (lat, lng), address             │
│ ├── amenities, capacity, occupancy, price                    │
│ ├── rating (COMPUTED from reviews)                           │
│ └── reviews_count (COMPUTED from reviews)                    │
└──────────────────────────────────────────────────────────────┘
    │
    ├─── N:1 ←── business_users (FK: business_user_id)
    │
    ├─── 1:N ──→ bookings (FK: venue_id)
    │              └── Trigger: updates availability
    │
    ├─── 1:N ──→ reviews (FK: venue_id)
    │              └── Trigger: updates rating
    │
    ├─── 1:N ──→ schedules (FK: venue_id)
    │              └── Track available time slots
    │
    ├─── 1:N ──→ memberships (FK: venue_id)
    │
    └─── 1:N ──→ favorites (FK: venue_id)


TRANSACTIONAL ENTITIES:
┌──────────────────────────────────────────────────────────────┐
│ bookings ←─ 0..1:1 ──→ payments                              │
│ bookings ←─ 0..1:1 ──→ reviews                               │
│ memberships ←─ 0..1:1 ──→ payments                           │
│ payments ←─ 0..1:1 ──→ venues (direct payment to venue)      │
└──────────────────────────────────────────────────────────────┘

SUPPORT ENTITIES:
┌──────────────────────────────────────────────────────────────┐
│ notifications ←─ polymorphic ──→ users | business_users      │
│ otps ←─ email-based ──→ users | business_users (email)       │
│ audit_logs ←─ optional ──→ users | business_users            │
└──────────────────────────────────────────────────────────────┘
```

### Relationship Matrix

| Parent Table | Child Table | Type | Delete Behavior | Notes |
|-------------|------------|------|-----------------|-------|
| users | bookings | 1:N | CASCADE | User deletes → bookings deleted |
| users | reviews | 1:N | CASCADE | User deletes → reviews deleted |
| users | favorites | 1:N | CASCADE | User deletes → favorites deleted |
| users | payments | 1:N | CASCADE | User deletes → payments deleted |
| users | memberships | 1:N | CASCADE | User deletes → memberships deleted |
| users | business_members | 1:N | CASCADE | User deletes → business_members deleted |
| business_users | venues | 1:N | CASCADE | Business deletes → venues deleted |
| business_users | business_members | 1:N | CASCADE | Business deletes → business_members deleted |
| business_users | memberships | 1:N | CASCADE | Business deletes → memberships deleted |
| venues | bookings | 1:N | CASCADE | Venue deletes → bookings deleted |
| venues | reviews | 1:N | CASCADE | Venue deletes → reviews deleted |
| venues | schedules | 1:N | CASCADE | Venue deletes → schedules deleted |
| venues | memberships | 1:N | CASCADE | Venue deletes → memberships deleted |
| bookings | reviews | 1:0..1 | SET NULL | Review can exist without booking |
| bookings | payments | 1:0..1 | SET NULL | Payment can exist without booking |
| venues | payments | 1:0..1 | SET NULL | Payment can exist without venue |
| memberships | payments | 1:0..1 | SET NULL | Payment can exist without membership |
| memberships | business_members | 1:0..1 | SET NULL | No direct FK |

---

## 🌐 API Endpoints by Module

### Module 1: Authentication Routes (`/auth`)

| HTTP Method | Endpoint | Requires Auth | Description | Tables Affected |
|------------|----------|---------------|-------------|-----------------|
| POST | `/auth/member/signup` | ❌ | Register new user | `users`, `otps` |
| POST | `/auth/business/signup` | ❌ | Register business account | `business_users`, `otps` |
| POST | `/auth/login` | ❌ | Login user/business | `users` / `business_users`, `audit_logs` |
| POST | `/auth/verify-email` | ❌ | Verify email with OTP | `users`, `business_users`, `otps` |
| POST | `/auth/resend-otp` | ❌ | Resend OTP code | `otps` |
| POST | `/auth/business/verify-email` | ❌ | Business email verification | `business_users`, `otps` |
| POST | `/auth/business/resend-otp` | ❌ | Business resend OTP | `otps` |
| GET | `/auth/check-email` | ❌ | Check email existence | `users`, `business_users` |
| GET | `/auth/check-phone` | ❌ | Check phone existence | `users` |
| POST | `/auth/forgot-password` | ❌ | Request password reset | `otps` |
| POST | `/auth/verify-reset-otp` | ❌ | Verify reset OTP | `otps` |
| POST | `/auth/reset-password` | ❌ | Reset password | `users`, `business_users` |

**Data Creation/Update:**
- `registerUser()` → **INSERT** into `users` + **INSERT** into `otps`
- `registerBusinessUser()` → **INSERT** into `business_users` + **INSERT** into `otps`
- `verifyEmail()` → **UPDATE** `users.email_verified = TRUE` + **UPDATE** `otps.verified = TRUE`
- `resetPassword()` → **UPDATE** `users.password_hash` / `business_users.password_hash`

---

### Module 2: User Routes (`/users`)

| HTTP Method | Endpoint | Requires Auth | Description | Tables Affected |
|------------|----------|---------------|-------------|-----------------|
| GET | `/users/me` | ✅ (User) | Get current user profile | `users` |
| PATCH | `/users/me` | ✅ (User) | Update user profile | `users` |
| GET | `/users/me/favorites` | ✅ (User) | Get user's favorite venues | `favorites`, `venues` |
| POST | `/users/me/favorites/:venueId` | ✅ (User) | Add venue to favorites | `favorites` |
| DELETE | `/users/me/favorites/:venueId` | ✅ (User) | Remove from favorites | `favorites` |
| GET | `/users/me/payments` | ✅ (User) | Get user's payments | `payments` |
| POST | `/users/me/change-password` | ✅ (User) | Change password | `users` |

**Data Operations:**
- `getCurrentUser()` → **SELECT** `users`
- `updateUserProfile()` → **UPDATE** `users` (name, phone, location, preferences)
- `addFavorite()` → **INSERT** into `favorites`
- `removeFavorite()` → **DELETE** from `favorites`
- `getUserPayments()` → **SELECT** `payments` WHERE `user_id = ?`

---

### Module 3: Venue Routes (`/venues`)

| HTTP Method | Endpoint | Requires Auth | Description | Tables Affected |
|------------|----------|---------------|-------------|-----------------|
| GET | `/venues` | ⚪ (Optional) | List venues with filters | `venues`, `favorites` (if auth) |
| GET | `/venues/:id` | ⚪ (Optional) | Get venue details | `venues`, `reviews` |
| GET | `/venues/:id/schedule` | ⚪ (Optional) | Get venue time slots | `schedules` |
| GET | `/venues/:id/reviews` | ⚪ (Optional) | Get venue reviews (paginated) | `reviews`, `users` |
| GET | `/venues/:id/availability` | ⚪ (Optional) | Check specific time slot | `schedules` |

**Data Operations:**
- `listVenues()` → **SELECT** `venues` with filters (category, city, rating, price, geo-location)
- `getVenueById()` → **SELECT** `venues` + **SELECT** `reviews` (aggregate)
- `getVenueSchedule()` → **SELECT** `schedules` WHERE `venue_id = ? AND date = ?`
- `getVenueReviews()` → **SELECT** `reviews` WHERE `venue_id = ?` (paginated)
- `checkAvailability()` → **SELECT** `schedules` WHERE `venue_id = ? AND date = ? AND time = ?`

---

### Module 4: Booking Routes (`/bookings`)

| HTTP Method | Endpoint | Requires Auth | Description | Tables Affected |
|------------|----------|---------------|-------------|-----------------|
| POST | `/bookings` | ✅ (User) | Create new booking | `bookings`, `schedules`, `payments`, `notifications` |
| GET | `/bookings` | ✅ (User) | Get user's bookings | `bookings`, `venues` |
| GET | `/bookings/:id` | ✅ (User) | Get booking details | `bookings` |
| PATCH | `/bookings/:id` | ✅ (User) | Update booking | `bookings`, `schedules` |
| DELETE | `/bookings/:id` | ✅ (User) | Cancel booking | `bookings`, `schedules`, `payments`, `notifications` |
| GET | `/bookings/business/all` | ✅ (Business) | Get business bookings | `bookings`, `users`, `venues` |
| POST | `/bookings/business` | ✅ (Business) | Create business appointment | `bookings`, `schedules`, `notifications` |
| PATCH | `/bookings/business/:id/status` | ✅ (Business) | Update booking status | `bookings`, `notifications` |

**Data Operations:**
- `createBooking()` → **INSERT** `bookings` + **UPDATE** `schedules.booked_slots` + **INSERT** `notifications`
  - Trigger updates `schedules.available_slots` automatically
- `getUserBookings()` → **SELECT** `bookings` WHERE `user_id = ?` + JOIN `venues`
- `updateBooking()` → **UPDATE** `bookings` (date, time, duration, attendees, special_requests)
- `cancelBooking()` → **UPDATE** `bookings.status = 'cancelled'` + **UPDATE** `schedules` release slot
- `getBusinessBookings()` → **SELECT** `bookings` WHERE `venue.business_user_id = ?`
- `updateBookingStatus()` → **UPDATE** `bookings.status` (pending → confirmed → completed)

---

### Module 5: Review Routes (`/reviews`)

| HTTP Method | Endpoint | Requires Auth | Description | Tables Affected |
|------------|----------|---------------|-------------|-----------------|
| POST | `/reviews` | ✅ (User) | Create review | `reviews`, `venues`, `notifications` |
| PATCH | `/reviews/:id` | ✅ (User) | Update review | `reviews`, `venues` |
| DELETE | `/reviews/:id` | ✅ (User) | Delete review | `reviews`, `venues` |
| POST | `/reviews/:id/reply` | ✅ (Business) | Add business reply | `reviews`, `notifications` |

**Data Operations:**
- `createReview()` → **INSERT** `reviews` + **UPDATE venues.rating/reviews_count** (via trigger)
  - Trigger automatically recalculates venue rating
- `updateReview()` → **UPDATE** `reviews` + **UPDATE** `venues` (rating recalculated by trigger)
- `deleteReview()` → **DELETE** `reviews` + **UPDATE** `venues` (rating recalculated by trigger)
- `addBusinessReply()` → **UPDATE** `reviews.business_reply` + **INSERT** `notifications`

---

### Module 6: Business Routes (`/business`)

| HTTP Method | Endpoint | Requires Auth | Description | Tables Affected |
|------------|----------|---------------|-------------|-----------------|
| GET | `/business/me` | ✅ (Business) | Get business profile | `business_users`, `venues` |
| PATCH | `/business/me` | ✅ (Business) | Update business profile | `business_users` |
| GET | `/business/dashboard/stats` | ✅ (Business) | Dashboard statistics | `bookings`, `payments`, `memberships` |
| GET | `/business/analytics` | ✅ (Business) | Business analytics (period-based) | `bookings`, `memberships`, `reviews`, `payments` |
| GET | `/business/members` | ✅ (Business) | Get business members (paginated) | `business_members`, `memberships`, `users` |
| POST | `/business/members` | ✅ (Business) | Add member with membership | `business_members`, `memberships`, `users`, `payments`, `notifications` |
| DELETE | `/business/memberships/:id` | ✅ (Business) | Cancel membership | `memberships`, `business_members`, `notifications` |
| POST | `/business/announcements` | ✅ (Business) | Send announcement | `notifications` |
| POST | `/business/change-password` | ✅ (Business) | Change password | `business_users` |
| GET | `/business/venue-id` | ✅ (Business) | Get business's venue ID | `venues` |

**Settings Routes:**
| PATCH | `/business/settings/business-info` | ✅ (Business) | Update business info | `business_users` |
| PATCH | `/business/settings/location-media` | ✅ (Business) | Update location/media | `business_users` |
| PATCH | `/business/settings/attributes` | ✅ (Business) | Update attributes (JSONB) | `business_users` |
| PATCH | `/business/settings/pricing` | ✅ (Business) | Update pricing | `business_users` |
| PATCH | `/business/settings/operating-hours` | ✅ (Business) | Update hours (JSONB) | `venues` |
| PATCH | `/business/settings/notifications` | ✅ (Business) | Update notification prefs | `business_users` |
| PATCH | `/business/settings/security` | ✅ (Business) | Update security settings | `business_users` |
| PATCH | `/business/settings/publish` | ✅ (Business) | Publish/unpublish | `business_users`, `venues` |

**Data Operations:**
- `getBusinessProfile()` → **SELECT** `business_users` + **SELECT** `venues`
- `updateBusinessProfile()` → **UPDATE** `business_users`
- `getDashboardStats()` → **SELECT COUNT/SUM** from `bookings`, `payments`, `memberships`
- `getBusinessMembers()` → **SELECT** `business_members` JOIN `users` JOIN `memberships`
- `addBusinessMember()` → **INSERT** `users` (if new) + **INSERT** `memberships` + **INSERT** `business_members` + **INSERT** `payments`
- `cancelMembership()` → **UPDATE** `memberships.status = 'cancelled'` + DELETE
 `business_members`
- `sendAnnouncement()` → **INSERT** `notifications` (batch for all members)

---

### Module 7: Payment Routes (`/payments`)

| HTTP Method | Endpoint | Requires Auth | Description | Tables Affected |
|------------|----------|---------------|-------------|-----------------|
| GET | `/payments/business` | ✅ (Business) | Get business payments | `payments`, `bookings`, `users` |
| POST | `/payments/business` | ✅ (Business) | Create payment | `payments`, `audit_logs` |
| PATCH | `/payments/business/:id/status` | ✅ (Business) | Update payment status | `payments`, `bookings`, `memberships`, `notifications` |
| GET | `/payments/business/stats` | ✅ (Business) | Payment statistics | `payments` |

**Data Operations:**
- `getBusinessPayments()` → **SELECT** `payments` WHERE `venue_id IN (business venues)` OR `membership_id`
- `createPayment()` → **INSERT** `payments` + **INSERT** `audit_logs`
- `updatePaymentStatus()` → **UPDATE** `payments.payment_status` + **UPDATE** `bookings.payment_status` (if linked)
  - If status = 'completed': **UPDATE** `memberships` and send `notifications`

---

### Module 8: Notification Routes (`/notifications`)

| HTTP Method | Endpoint | Requires Auth | Description | Tables Affected |
|------------|----------|---------------|-------------|-----------------|
| GET | `/notifications` | ✅ (Any) | Get user notifications | `notifications` |
| PATCH | `/notifications/:id/read` | ✅ (Any) | Mark notification as read | `notifications` |
| PATCH | `/notifications/read-all` | ✅ (Any) | Mark all as read | `notifications` |
| DELETE | `/notifications/:id` | ✅ (Any) | Delete notification | `notifications` |

**Data Operations:**
- `getNotifications()` → **SELECT** `notifications` WHERE `user_id = ? AND user_type = ?` (paginated)
- `markAsRead()` → **UPDATE** `notifications.read = TRUE, read_at = NOW()`
- `deleteNotification()` → **DELETE** `notifications` OR soft-delete

---

## 📊 CRUD Operations Mapping

### Summary: All CRUD Operations by Table

| Table | CREATE | READ | UPDATE | DELETE | Triggers |
|-------|--------|------|--------|--------|----------|
| `users` | Auth Signup | Auth Login, Get Profile | Update Profile, Change Password | Soft Delete | - |
| `business_users` | Auth Signup | Get Profile, Dashboard | Update Profile, Settings | Soft Delete | CASCADE → venues, business_members, memberships |
| `venues` | Business Create | List, Detail, Search | Publish Status, Info, Pricing | Soft Delete | Auto-calc: rating, reviews_count |
| `bookings` | User/Business Create | Get All, Get By ID | Update Details, Update Status | Cancel | Auto-update: schedules availability |
| `reviews` | User Create | Get By Venue, Get Count | Update | Delete | Auto-calc: venue rating, reviews_count |
| `favorites` | Add | Get User Favorites | - | Remove | - |
| `notifications` | Auto (triggers) | Get All, Filter | Mark as Read | Delete | - |
| `payments` | Create | Get Business/User | Update Status | - | - |
| `memberships` | Add Member | Get Business Members | - | Cancel | Cascading delete business_members |
| `business_members` | Add | Get All | - | Remove | Set NULL → memberships |
| `schedules` | Auto (create venue) | Get By Date | - | - | Auto-update: booked_slots, available_slots |
| `otps` | Signup/Reset | Verify | - | Expire | - |
| `audit_logs` | Auto (actions) | Query | - | - | - |

### Detailed CRUD Operations

#### `users` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | POST `/auth/member/signup` | INSERT INTO users (...) | Insert user record + INSERT OTP | Hash password with bcrypt |
| **READ** | GET `/auth/login` | SELECT * FROM users WHERE email=? | Load user for auth | Check password_hash |
| **READ** | GET `/users/me` | SELECT * FROM users WHERE id=? | Get authenticated user | Includes preferences |
| **UPDATE** | PATCH `/users/me` | UPDATE users SET name=?, phone=?, location=?, preferences=? WHERE id=? | Update profile fields | Only authenticated user can update |
| **UPDATE** | POST `/users/me/change-password` | UPDATE users SET password_hash=? WHERE id=? | Update password only | Verify current password first |
| **DELETE** | (implicit) | UPDATE users SET deleted_at=NOW() WHERE id=? | Soft delete user | Logs: audit_logs |

#### `business_users` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | POST `/auth/business/signup` | INSERT INTO business_users (...) | Insert business + INSERT OTP | Hash password, set status=pending_verification |
| **READ** | GET `/business/me` | SELECT * FROM business_users WHERE id=? | Get business + SELECT venues | Includes all settings |
| **UPDATE** | PATCH `/business/me` | UPDATE business_users SET ... WHERE id=? | Update profile fields | Can update pricing packages |
| **UPDATE** | PATCH `/business/settings/business-info` | UPDATE business_users SET business_name=?, email=?, phone=? | Update business info | Partial updates |
| **UPDATE** | PATCH `/business/settings/location-media` | UPDATE business_users SET address_lat=?, address_lng=?, avatar=? | Update media/location | Can include image URLs |
| **UPDATE** | PATCH `/business/settings/pricing` | UPDATE business_users SET daily_package_price=?, weekly_package_price=?, monthly_package_price=? | Update pricing tiers | Affects new memberships |
| **UPDATE** | PATCH `/business/settings/publish` | UPDATE business_users SET is_published=TRUE, published_at=NOW() | Publish business to platform | Status: published |
| **DELETE** | (implicit) | UPDATE business_users SET deleted_at=NOW() WHERE id=?; CASCADE DELETE venues, business_members, memberships | Soft delete business | All related records deleted |

#### `venues` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | (via business signup) | INSERT INTO venues (...) | Auto-create default venue for business | OR manually create in business dashboard |
| **READ** | GET `/venues` | SELECT * FROM venues WHERE category=? AND city=? AND deleted_at IS NULL | List with filters + pagination | Apply price/rating/distance filters |
| **READ** | GET `/venues/:id` | SELECT * FROM venues WHERE id=? | Get single venue + JOIN reviews | Include ratings aggregation |
| **READ** | GET `/venues/:id/schedule` | SELECT * FROM schedules WHERE venue_id=? AND date>=NOW() | Get availability | For booking UI |
| **UPDATE** | PATCH `/business/settings/publish` | UPDATE venues SET is_published=TRUE WHERE business_user_id=? | Publish venue | Auto from business publish |
| **UPDATE** | (trigger) | UPDATE venues SET rating=(SELECT AVG(rating) FROM reviews WHERE venue_id=?), reviews_count=(SELECT COUNT(*) FROM reviews) | Computed fields | Auto-calculated by trigger |
| **DELETE** | (implicit) | UPDATE venues SET deleted_at=NOW() WHERE id=?; CASCADE DELETE bookings, reviews, schedules, memberships | Soft delete | All bookings/reviews cascade |

#### `bookings` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | POST `/bookings` | INSERT INTO bookings (...) + UPDATE schedules SET booked_slots=booked_slots+1 | Create booking + reserve slot | Trigger: auto-calc available_slots |
| **CREATE** | POST `/bookings/business` | INSERT INTO bookings (...) | Business creates appointment | Can be for non-registered user |
| **READ** | GET `/bookings` | SELECT * FROM bookings WHERE user_id=? | Get user's bookings | With pagination |
| **READ** | GET `/bookings/:id` | SELECT * FROM bookings WHERE id=? AND user_id=? | Get single booking | Authorization check |
| **READ** | GET `/bookings/business/all` | SELECT * FROM bookings WHERE venue_id IN (business venues) | Get business bookings | Can filter by status, date |
| **UPDATE** | PATCH `/bookings/:id` | UPDATE bookings SET date=?, time=?, duration=?, attendees=? WHERE id=? | Reschedule booking | Auto-update schedules |
| **UPDATE** | PATCH `/bookings/business/:id/status` | UPDATE bookings SET status=? WHERE id=? | Change status: pending→confirmed→completed | Business only |
| **DELETE** | DELETE `/bookings/:id` | UPDATE bookings SET status='cancelled', cancelled_at=NOW(), cancelled_reason=? | Cancel booking | Release schedule slot via trigger |

#### `reviews` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | POST `/reviews` | INSERT INTO reviews (user_id, venue_id, booking_id, rating, comment) | Create review | Trigger: updates venues (rating, reviews_count) |
| **READ** | GET `/venues/:id/reviews` | SELECT * FROM reviews WHERE venue_id=? | Get venue reviews | Paginated, includes user info |
| **UPDATE** | PATCH `/reviews/:id` | UPDATE reviews SET rating=?, comment=? WHERE id=? AND user_id=? | Edit review | Trigger: recalc venue rating |
| **UPDATE** | POST `/reviews/:id/reply` | UPDATE reviews SET business_reply=?, business_reply_date=NOW() | Business response | Create notification for user |
| **DELETE** | DELETE `/reviews/:id` | UPDATE reviews SET deleted_at=NOW() | Soft delete review | Trigger: recalc venue rating |

#### `favorites` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | POST `/users/me/favorites/:venueId` | INSERT INTO favorites (user_id, venue_id) | Add favorite | Constraint: UNIQUE(user_id, venue_id) |
| **READ** | GET `/users/me/favorites` | SELECT v.* FROM venues v JOIN favorites f ON f.venue_id=v.id WHERE f.user_id=? | Get user's favorites | Shows favorite venues |
| **DELETE** | DELETE `/users/me/favorites/:venueId` | DELETE FROM favorites WHERE user_id=? AND venue_id=? | Remove favorite | User action |

#### `notifications` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | (auto from events) | INSERT INTO notifications (...) | Auto-created by triggers | Booking confirmed, review posted, membership started, announcement sent |
| **READ** | GET `/notifications` | SELECT * FROM notifications WHERE user_id=? AND user_type=? | Get user notifications | User-specific, excludes read filter if provided |
| **UPDATE** | PATCH `/notifications/:id/read` | UPDATE notifications SET read=TRUE, read_at=NOW() WHERE id=? | Mark as read | User action |
| **UPDATE** | PATCH `/notifications/read-all` | UPDATE notifications SET read=TRUE, read_at=NOW() WHERE user_id=? | Mark all read | Bulk update |
| **DELETE** | DELETE `/notifications/:id` | DELETE FROM notifications WHERE id=? AND user_id=? | Delete notification | Hard delete |

#### `payments` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | POST `/bookings` | INSERT INTO payments (user_id, booking_id, amount, payment_status='pending') | Create payment for booking | Payment method varies |
| **CREATE** | POST `/business/members` | INSERT INTO payments (user_id, amount, payment_status, ...) | Create payment for membership | Business receives payment |
| **READ** | GET `/users/me/payments` | SELECT * FROM payments WHERE user_id=? | Get user payments | Show transaction history |
| **READ** | GET `/payments/business` | SELECT * FROM payments WHERE venue_id IN (business venues) OR user_id IN (members) | Get business payments | Track revenue |
| **UPDATE** | PATCH `/payments/business/:id/status` | UPDATE payments SET payment_status=?, completed_at=NOW() | Update payment status | pending→completed/failed/refunded |
| **DELETE** | - | - | Not typically deleted | Kept for audit trail |

#### `memberships` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | POST `/business/members` | INSERT INTO memberships (user_id, venue_id, business_user_id, membership_type, start_date, end_date, price, status='active') | Create membership | For business members |
| **READ** | GET `/business/members` | SELECT m.*, u.* FROM memberships m JOIN users u ON m.user_id=u.id WHERE m.business_user_id=? | Get business members | Detailed with membership info |
| **UPDATE** | (auto-renewal) | UPDATE memberships SET auto_renew=TRUE, end_date=DATE_ADD(end_date, INTERVAL 1 MONTH) | Auto-renew membership | Cron job |
| **DELETE** | DELETE `/business/memberships/:id` | UPDATE memberships SET status='cancelled', ... | Cancel membership | Remove business_members link |

#### `business_members` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | POST `/business/members` | INSERT INTO business_members (business_user_id, user_id, membership_id) | Assign user as member | Links user to business |
| **READ** | GET `/business/members` | SELECT * FROM business_members WHERE business_user_id=? | Get member list | Used in memberships query |
| **DELETE** | DELETE `/business/memberships/:id` | DELETE FROM business_members WHERE membership_id=? | Remove member | When membership cancelled |

#### `schedules` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | (auto/bulk) | INSERT INTO schedules (venue_id, date, time_slot, total_slots, booked_slots=0) | Create time slots | Bulk insert when publish venue |
| **READ** | GET `/venues/:id/schedule` | SELECT * FROM schedules WHERE venue_id=? AND date=? AND is_available=TRUE | Get available slots | For booking |
| **UPDATE** | (trigger) | UPDATE schedules SET booked_slots=booked_slots+1, available_slots=available_slots-1 WHERE id=? | Update when booking created | Auto by trigger |
| **UPDATE** | (trigger) | UPDATE schedules SET booked_slots=booked_slots-1, available_slots=available_slots+1 WHERE id=? | Update when booking cancelled | Auto by trigger |

#### `otps` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | POST `/auth/member/signup`, POST `/auth/forgot-password` | INSERT INTO otps (email, otp_code, otp_type, expires_at) | Create OTP record | Code expires in ~10 min |
| **READ** | POST `/auth/verify-email` | SELECT * FROM otps WHERE email=? AND otp_code=? | Verify OTP | Check attempts & expiry |
| **UPDATE** | POST `/auth/verify-email` | UPDATE otps SET verified=TRUE WHERE id=? | Mark as verified | Increment attempts |
| **DELETE** | - | - | Auto-expire | Cron job deletes expired |

#### `audit_logs` Table
| Operation | API Endpoint | SQL | Changes | Notes |
|-----------|-------------|-----|---------|-------|
| **CREATE** | (auto from events) | INSERT INTO audit_logs (user_id, user_type, action, resource_type, resource_id, ip_address, metadata) | Log user actions | Every important action |
| **READ** | (admin API) | SELECT * FROM audit_logs WHERE user_id=? OR action=? | Query audit trail | For security/compliance |

---

## 🔄 Data Flow Diagrams

### Flow 1: User Registration & Email Verification

```
┌─────────────────────────────────────────────────────────────────┐
│ USER REGISTRATION & EMAIL VERIFICATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

Frontend                Backend          Database        Services
│                         │                 │                │
├─ POST /auth/member/──── │                 │                │
│  signup ()              │                 │                │
│  (email, name,          │                 │                │
│   phone, password,      │                 │                │
│   location, preferences)│                 │                │
│                         │                 │                │
│                         ├─ Hash password  │                │
│                         │   (bcrypt)      │                │
│                         │                 │                │
│                         ├─ INSERT users   │                │
│                         ├───────────────→ │ users (id, │
│                         │                 │  email, password_hash,
│                         │                 │  email_verified=FALSE)
│                         │                 │                │
│                         ├─ Generate OTP   │                │
│                         ├─────────────────────────────────→│
│                         │                 │                │ EmailService
│                         │                 │                │ sendOTP()
│                         │                 │                │
│                         ├─ INSERT otps    │                │
│                         ├───────────────→ │ otps (id,   │
│                         │                 │  email, otp_code,
│                         │                 │  otp_type='email_verification',
│                         │                 │  expires_at, verified=FALSE)
│                         │                 │                │
│← Return (success, userId, email) │       │                │
│                         │                 │                │
├─ POST /auth/verify-──── │                 │                │
│  email (email, otp)     │                 │                │
│                         │                 │                │
│                         ├─ SELECT otps    │                │
│                         ├───────────────→ │ Find OTP record │
│                         │← Check expiry   │                │
│                         │  & attempts     │                │
│                         │                 │                │
│                         ├─ UPDATE users   │                │
│                         ├───────────────→ │ email_verified │
│                         │                 │ = TRUE         │
│                         │                 │                │
│                         ├─ UPDATE otps    │                │
│                         ├───────────────→ │ verified = TRUE│
│                         │                 │                │
│← Return (success)       │                 │                │
│                         │                 │                │
└─────────────────────────────────────────────────────────────────┘

Result:
✓ users table: CREATE 1 user record
✓ otps table: CREATE & UPDATE 1 OTP record
✓ Email sent with OTP code
✓ User account ready for login
```

### Flow 2: Booking Creation & Schedule Update

```
┌─────────────────────────────────────────────────────────────────┐
│ BOOKING CREATION & SCHEDULE UPDATE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Frontend                Backend          Database        Services
│                         │                 │                │
├─ GET /venues/:id/──────┤                 │                │
│  availability           │                 │                │
│  (date, time)           │                 │                │
│                         ├─ SELECT schedules│               │
│                         ├───────────────→ │ Check slot    │
│← Available slots info   │                 │ availability  │
│                         │                 │                │
├─ POST /bookings ─────── │                 │                │
│ (venueId, date,         │                 │                │
│  time, duration,        │                 │                │
│  attendees)             │                 │                │
│                         │                 │                │
│                         ├─ Validate slot  │                │
│                         │   availability  │                │
│                         │                 │                │
│                         ├─ START TRANSACTION               │
│                         │                 │                │
│                         ├─ INSERT bookings│               │
│                         ├───────────────→ │ CREATE booking │
│                         │ (user_id,       │ (status=pending)
│                         │  venue_id,      │                │
│                         │  booking_date,  │                │
│                         │  booking_time,  │                │
│                         │  status=pending)│                │
│                         │                 │                │
│                         ├─ UPDATE schedules
│                         ├───────────────→ │ booked_slots++│
│                         │ (SET booked_    │ available_   │
│                         │  slots++,       │ slots-- (via  │
│                         │  is_available)  │ GENERATED)    │
│                         │                 │                │
│                         ├─ INSERT payments│               │
│                         ├───────────────→ │ CREATE payment │
│                         │ (user_id,       │ (status=pending)
│                         │  booking_id,    │                │
│                         │  amount)        │                │
│                         │                 │                │
│                         ├─ INSERT notifications
│                         ├───────────────→ │ Booking       │
│                         │ (user_id,       │ confirmed     │
│                         │  type='booking',│ notification  │
│                         │  message)       │                │
│                         │                 │                │
│                         ├─ COMMIT TRANSACTION              │
│                         │                 │                │
│← Return booking details │                 │                │
│ (confirmation)          │                 │                │
│                         │                 │                │
└─────────────────────────────────────────────────────────────────┘

Result:
✓ bookings table: CREATE 1 booking (status=pending)
✓ schedules table: UPDATE 1 schedule (increment booked_slots)
✓ payments table: CREATE 1 payment (status=pending)
✓ notifications table: CREATE 1 notification (booking confirmed)
✓ Trigger: venues.occupancy updated

Tables Modified: 4
Rows Affected: 4 INSERT + 1 UPDATE
```

### Flow 3: Landing a Booking with Payment Confirmation

```
┌─────────────────────────────────────────────────────────────────┐
│ BOOKING CONFIRMATION & PAYMENT UPDATE FLOW                      │
└─────────────────────────────────────────────────────────────────┘

Frontend                Backend          Database        Services
│                         │                 │                │
├─ Payment Gateway ────┐  │                 │                │
│ processes payment    └─→ POST /callback  │                │
│                         │ (transaction_id,│                │
│                         │  amount, status)│                │
│                         │                 │                │
│                         ├─ UPDATE payments│               │
│                         ├───────────────→ │ payment_status│
│                         │ (status=completed,              │
│                         │  transaction_id,                │
│                         │  completed_at)  │                │
│                         │                 │                │
│                         ├─ UPDATE bookings│               │
│                         ├───────────────→ │ status=       │
│                         │ (status='       │ confirmed,    │
│                         │  confirmed')    │ payment_status│
│                         │                 │ =paid         │
│                         │                 │                │
│                         ├─ INSERT notifications
│                         ├───────────────→ │ Payment       │
│                         │                 │ confirmed     │
│                         │                 │                │
│← Webhook confirmation  │                 │                │
│                         │                 │                │
└─────────────────────────────────────────────────────────────────┘

Result:
✓ payments table: UPDATE 1 payment (status=completed)
✓ bookings table: UPDATE 1 booking (status=confirmed)
✓ notifications table: CREATE 1 notification (payment confirmed)

Tables Modified: 3
Rows Affected: 2 UPDATE + 1 INSERT
```

### Flow 4: Review Creation & Venue Rating Update

```
┌─────────────────────────────────────────────────────────────────┐
│ REVIEW CREATION & VENUE RATING RECALCULATION FLOW               │
└─────────────────────────────────────────────────────────────────┘

Frontend                Backend          Database        Services
│                         │                 │                │
├─ POST /reviews ─────── │                 │                │
│ (venueId, bookingId,    │                 │                │
│  rating: 1-5,           │                 │                │
│  comment)               │                 │                │
│                         │                 │                │
│                         ├─ Validate user  │                │
│                         │   (must have    │                │
│                         │    booking)     │                │
│                         │                 │                │
│                         ├─ INSERT reviews │               │
│                         ├───────────────→ │ CREATE review  │
│                         │ (user_id,       │ (status=pending)
│                         │  venue_id,      │                │
│                         │  booking_id,    │                │
│                         │  rating,        │                │
│                         │  comment)       │                │
│                         │                 │                │
│                         │   ┌─ TRIGGER: update_venue_rating()
│                         │   │             │                │
│                         │   ├─ COMPUTE    │                │
│                         │   │ NEW RATING  │                │
│                         │   │ (AVG rating)│                │
│                         │   │             │                │
│                         │   ├─ UPDATE venues
│                         │   ├───────────→ │ rating =       │
│                         │   │ (SET rating=│ recalculated   │
│                         │   │  (SELECT    │ reviews_count++│
│                         │   │   AVG(rating)
│                         │   │   FROM      │                │
│                         │   │   reviews)  │                │
│                         │   │             │                │
│                         │   ├─ RETURN     │                │
│                         │   └─ TRIGGER END
│                         │                 │                │
│                         ├─ INSERT notifications
│                         ├───────────────→ │ New review     │
│                         │ (user_type=     │ posted (for    │
│                         │  business,      │ business)      │
│                         │  title="New     │                │
│                         │  Review")       │                │
│                         │                 │                │
│← Return review details  │                 │                │
│                         │                 │                │
└─────────────────────────────────────────────────────────────────┘

Result:
✓ reviews table: CREATE 1 review
✓ venues table: UPDATE 1 venue (rating recalculated, reviews_count++)
✓ notifications table: CREATE 1 notification (business notified)

Tables Modified: 3
Rows Affected: 1 INSERT + 1 UPDATE + 1 INSERT
Key: Trigger automatically recalculates rating!
```

### Flow 5: Business Member Addition with Membership

```
┌─────────────────────────────────────────────────────────────────┐
│ ADD BUSINESS MEMBER & CREATE MEMBERSHIP FLOW                    │
└─────────────────────────────────────────────────────────────────┘

Frontend                Backend          Database        Services
│                         │                 │                │
├─ POST /business/───────┤                 │                │
│  members                │                 │                │
│ (userName, userEmail,   │                 │                │
│  userPhone,             │                 │                │
│  membershipType,        │                 │                │
│  price)                 │                 │                │
│                         │                 │                │
│                         ├─ Check if user  │                │
│                         │   exists        │                │
│                         │   SELECT users  │                │
│                         ├───────────────→ │ WHERE email    │
│                         │                 │                │
│                         ├─ If NOT EXISTS: │
│                         │   CREATE user   │                │
│                         ├─ INSERT users  │──────────────→ │
│                         │ (email, name,   │ New user created│
│                         │  phone)         │ (no password)   │
│                         │                 │                │
│                         ├─ INSERT memberships
│                         ├───────────────→ │ Membership     │
│                         │ (user_id,       │ (automatically  │
│                         │  venue_id,      │  created)       │
│                         │  business_user_ │ status=active   │
│                         │  id,            │                │
│                         │  membership_    │                │
│                         │  type,          │                │
│                         │  price,         │                │
│                         │  start_date,    │                │
│                         │  end_date,      │                │
│                         │  status='active')
│                         │                 │                │
│                         ├─ INSERT business_members
│                         ├───────────────→ │ Association    │
│                         │ (business_user_ │ created        │
│                         │  id, user_id,   │                │
│                         │  membership_id) │                │
│                         │                 │                │
│                         ├─ INSERT payments│               │
│                         ├───────────────→ │ Payment record │
│                         │ (user_id,       │ for membership │
│                         │  amount=price,  │ (status=       │
│                         │  payment_status)│  pending)      │
│                         │                 │                │
│                         ├─ INSERT notifications
│                         ├───────────────→ │ Membership     │
│                         │ (type='         │ created        │
│                         │  membership_',  │ notification   │
│                         │  user_type=     │ (to user)      │
│                         │  'normal')      │                │
│                         │                 │                │
│← Return membership info │                 │                │
│                         │                 │                │
└─────────────────────────────────────────────────────────────────┘

Result:
✓ users table: CREATE 1 user (if new)
✓ memberships table: CREATE 1 membership (status=active)
✓ business_members table: CREATE 1 association
✓ payments table: CREATE 1 payment (status=pending)
✓ notifications table: CREATE 1 notification

Tables Modified: 4-5
Rows Affected: 3-4 INSERT + 0-1 INSERT
```

### Flow 6: What Happens When Business Publishes Venue

```
┌─────────────────────────────────────────────────────────────────┐
│ BUSINESS PUBLISH VENUE FLOW                                     │
└─────────────────────────────────────────────────────────────────┘

Frontend                Backend          Database        Services
│                         │                 │                │
├─ PATCH /business/──────┤                 │                │
│  settings/publish       │                 │                │
│  (isPublished: true)    │                 │                │
│                         │                 │                │
│                         ├─ UPDATE business_users
│                         ├───────────────→ │ is_published=  │
│                         │ (is_published=  │ TRUE           │
│                         │  TRUE,          │ published_at=  │
│                         │  published_at)  │ NOW()          │
│                         │                 │                │
│                         ├─ UPDATE venues │               │
│                         ├───────────────→ │ All business   │
│                         │ FOR ALL venues  │ venues set to  │
│                         │ WHERE           │ is_published=  │
│                         │  business_user_ │ TRUE           │
│                         │  id = ?         │ published_at   │
│                         │  (is_published, │                │
│                         │   published_at) │                │
│                         │                 │                │
│                         ├─ BULK INSERT schedules
│                         ├───────────────→ │ Create default │
│                         │ FOR NEXT 90 DAYS│ time slots     │
│                         │ (create slot    │ for 90 days    │
│                         │  every hour or  │ ahead          │
│                         │  time_slot      │ (auto-fill     │
│                         │  interval)      │ schedules)     │
│                         │                 │                │
│                         ├─ INSERT notifications
│                         ├───────────────→ │ Publish        │
│                         │ (to ADMINS)     │ confirmation   │
│                         │                 │                │
│← Return success         │                 │                │
│                         │                 │                │
│  RESULT: Venue now VISIBLE in /venues    │
│                         │                 │                │
└─────────────────────────────────────────────────────────────────┘

Result:
✓ business_users table: UPDATE 1 business (is_published=TRUE)
✓ venues table: UPDATE N venues (is_published=TRUE)
✓ schedules table: INSERT ~2160 schedule slots (90 days × 24 hours)
✓ notifications table: CREATE 1 notification (admin)

Tables Modified: 4
Rows Affected: 1 UPDATE + N UPDATE + 2160 INSERT + 1 INSERT
```

---

## 🔗 Frontend to Backend API Calls Mapping

### Frontend Components → API Calls → Database Tables

| Screen/Feature | Frontend Component | API Call | Method | Tables Affected | CRUD |
|---------------|-------------------|----------|--------|-----------------|------|
| **Authentication** |
| Signup | Signup.tsx | `POST /auth/member/signup` | POST | users, otps | C |
| Email Verification | VerifyEmail.tsx | `POST /auth/verify-email` | POST | users, otps | U |
| Login | Login.tsx | `POST /auth/login` | POST | users / business_users, audit_logs | R, C |
| Password Reset | ForgotPassword.tsx | `POST /auth/forgot-password` | POST | otps | C |
| **User Dashboard** |
| Profile View | ProfileSettings.tsx | `GET /users/me` | GET | users | R |
| Profile Update | ProfileSettings.tsx | `PATCH /users/me` | PATCH | users | U |
| View Favorites | Favorites.tsx | `GET /users/me/favorites` | GET | favorites, venues | R |
| Add Favorite | VenueCard.tsx | `POST /users/me/favorites/:id` | POST | favorites | C |
| Remove Favorite | Favorites.tsx | `DELETE /users/me/favorites/:id` | DELETE | favorites | D |
| View Bookings | UserDashboard.tsx | `GET /bookings` | GET | bookings, venues | R |
| View Payments | UserDashboard.tsx | `GET /users/me/payments` | GET | payments | R |
| **Venue Exploration** |
| Browse Venues | Explore.tsx | `GET /venues` | GET | venues | R |
| Search/Filter | Explore.tsx | `GET /venues?filters` | GET | venues | R |
| Venue Details | BusinessDetail.tsx | `GET /venues/:id` | GET | venues, reviews | R |
| Venue Reviews | BusinessDetail.tsx | `GET /venues/:id/reviews` | GET | reviews, users | R |
| Venue Schedule | BusinessDetail.tsx | `GET /venues/:id/schedule` | GET | schedules | R |
| Check Availability | BookingModal.tsx | `GET /venues/:id/availability` | GET | schedules | R |
| **Booking Flow** |
| Create Booking | BookingModal.tsx | `POST /bookings` | POST | bookings, schedules, payments, notifications | C |
| Update Booking | BookingModal.tsx | `PATCH /bookings/:id` | PATCH | bookings, schedules | U |
| Cancel Booking | UserDashboard.tsx | `DELETE /bookings/:id` | DELETE | bookings, schedules, payments, notifications | U, D |
| **Reviews** |
| Post Review | ReviewForm.tsx | `POST /reviews` | POST | reviews, venues, notifications | C |
| Edit Review | ReviewCard.tsx | `PATCH /reviews/:id` | PATCH | reviews, venues | U |
| Delete Review | ReviewCard.tsx | `DELETE /reviews/:id` | DELETE | reviews, venues | D |
| **Business Dashboard** |
| Business Profile | BusinessDashboard.tsx | `GET /business/me` | GET | business_users, venues | R |
| Update Profile | BusinessDashboard.tsx | `PATCH /business/me` | PATCH | business_users | U |
| Dashboard Stats | BusinessDashboard.tsx | `GET /business/dashboard/stats` | GET | bookings, payments, memberships | R |
| Business Analytics | BusinessDashboard.tsx | `GET /business/analytics` | GET | bookings, memberships, reviews, payments | R |
| Publish Venue | BusinessDashboard.tsx | `PATCH /business/settings/publish` | PATCH | business_users, venues, schedules, notifications | U, C |
| Update Business Info | BusinessSettings.tsx | `PATCH /business/settings/business-info` | PATCH | business_users | U |
| Update Pricing | BusinessSettings.tsx | `PATCH /business/settings/pricing` | PATCH | business_users | U |
| **Member Management** |
| View Members | BusinessDashboard.tsx | `GET /business/members` | GET | business_members, memberships, users | R |
| Add Member | BusinessDashboard.tsx | `POST /business/members` | POST | users, memberships, business_members, payments, notifications | C |
| Cancel Membership | BusinessDashboard.tsx | `DELETE /business/memberships/:id` | DELETE | memberships, business_members, notifications | D |
| **Booking Management (Business)** |
| View Bookings | BookingManagement.tsx | `GET /bookings/business/all` | GET | bookings, users, venues | R |
| Create Appointment | BookingManagement.tsx | `POST /bookings/business` | POST | bookings, users(?), schedules, notifications | C |
| Update Status | BookingManagement.tsx | `PATCH /bookings/business/:id/status` | PATCH | bookings, notifications | U |
| **Notifications** |
| View Notifications | Notifications.tsx | `GET /notifications` | GET | notifications | R |
| Mark as Read | Notifications.tsx | `PATCH /notifications/:id/read` | PATCH | notifications | U |
| Mark All Read | Notifications.tsx | `PATCH /notifications/read-all` | PATCH | notifications | U |
| Delete Notification | Notifications.tsx | `DELETE /notifications/:id` | DELETE | notifications | D |

---

## 📌 Key Insights

### Critical Relationships
1. **Cascading Deletes**: When a `business_user` is deleted, all their `venues`, `business_members`, and `memberships` are cascade-deleted
2. **Soft Deletes**: `users`, `business_users`, `venues`, `reviews` use soft deletes (deleted_at timestamp)
3. **Auto-Calculated Fields**:
   - `venues.rating` = AVG(reviews.rating) calculated by trigger
   - `venues.reviews_count` = COUNT(reviews) calculated by trigger
   - `schedules.available_slots` = total_slots - booked_slots (GENERATED column)

### Transaction-Critical Operations
- **Booking Creation**: Transaction should INSERT booking, UPDATE schedule, INSERT payment, INSERT notification (atomic)
- **Member Addition**: Transaction should handle user creation (if new), membership creation, business_member creation, payment (atomic)
- **Review Posting**: Trigger automatically updates venue rating

### Data Consistency Rules
- One review per `(user, venue)` pair (UNIQUE constraint)
- One favorite per `(user, venue)` pair (UNIQUE constraint)
- One `business_member` per `(business_user, user)` pair (UNIQUE constraint)
- Schedules must have `is_available=TRUE` when `booked_slots < total_slots`

### Security Considerations
- Passwords always bcrypt hashed (never stored plaintext)
- OTP codes expire within 10 minutes
- Account lockout after failed login attempts
- All mutations logged in `audit_logs`
- Permissions: Users can only modify their own records
- Business users can only see their own data

---

This documentation provides complete mapping for creating ERD diagrams, database schema visualizations, and API architecture diagrams. Each table shows its relationships, indexes, CRUD operations, and affected data flows.
