# Frontend Analysis Report

**Generated:** January 2026  
**Project:** Portal - Gym, Library & Coaching Booking Platform

## Executive Summary

This document provides a comprehensive analysis of the frontend codebase to guide complete backend implementation. The application is a multi-tenant platform connecting members with gyms, libraries, and coaching centers.

---

## 1. Project Structure Analysis

### 1.1 Technology Stack
- **Framework:** React 18.3.1 with TypeScript
- **Build Tool:** Vite 5.4.19
- **Routing:** React Router DOM 6.30.1
- **State Management:** Zustand 5.0.10
- **API Client:** Axios 1.13.2 with custom interceptors
- **Form Handling:** React Hook Form 7.61.1 + Zod 3.25.76
- **UI Library:** Radix UI + Tailwind CSS
- **Data Fetching:** TanStack Query 5.83.0

### 1.2 Folder Structure
```
src/
├── api/              # API configuration (axios.config.ts)
├── components/       # React components
│   ├── auth/        # Authentication components
│   ├── booking/     # Booking modals
│   ├── business/    # Business-specific components
│   ├── explore/     # Search/filter components
│   ├── payments/    # Payment components
│   └── ui/          # Reusable UI components
├── data/mock/       # Mock data files (9 JSON files)
├── hooks/           # Custom React hooks
├── lib/             # Utilities and services
├── pages/           # Page components (32 files)
├── store/           # Zustand stores (9 files)
└── i18n/            # Internationalization
```

### 1.3 State Management
- **Auth Store:** User authentication, session management
- **Filter Store:** Search/filter state for explore page
- **Favorite Store:** User favorites (persisted)
- **Venue Store:** Business/venue data management

---

## 2. User Flows & Features

### 2.1 Authentication Flows

#### Member Signup Flow
1. **Step 1: Personal Info**
   - Full name (required, min 2 chars)
   - Email (required, valid email format)
   - Phone (required, format: +971-50-123-4567)
   - Country code (default: +971)
   - Location (lat/lng/address) - optional

2. **Step 2: Preferences**
   - Categories selection (gym, coaching, library) - multi-select
   - Price range ($, $$, $$$) - optional

3. **Step 3: Security**
   - Password (required, min 8 chars, strength validation)
   - Confirm password (must match)
   - Terms & Privacy acceptance (required)
   - Marketing consent (optional)

**API Endpoint:** `POST /api/auth/member/signup`

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "501234567",
  "countryCode": "+971",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "location": {
    "lat": 25.2048,
    "lng": 55.2708,
    "address": "Dubai, UAE"
  },
  "categories": ["gym", "coaching"],
  "acceptTerms": true,
  "acceptPrivacy": true,
  "marketingConsent": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully! Please verify your email.",
  "data": {
    "userId": "uuid",
    "email": "john@example.com"
  }
}
```

#### Business Signup Flow
1. **Step 1: Business Info**
   - Business name (required)
   - Business type (gym/coaching/library) - required
   - Registration number (required)
   - Years in operation (dropdown)
   - Owner name (required)
   - Account manager email (optional)

2. **Step 2: Contact & Location**
   - Email (required, unique)
   - Phone (required)
   - Website (optional, URL validation)
   - Address (street, city, state, postal code, country)
   - Location coordinates (lat/lng) - optional

3. **Step 3: Business Details**
   - Number of locations (dropdown)
   - Total capacity (number)
   - Service areas (text)
   - Specialties (multi-select, type-specific)

4. **Step 4: Security**
   - Password (same validation as member)
   - Subscription tier (starter/growth/enterprise)
   - Terms & Privacy acceptance
   - Verification consent

**API Endpoint:** `POST /api/auth/business/signup`

#### Login Flow
- **Input:** Email or Phone + Password
- **Remember Me:** Optional (extends session)
- **Email Verification Check:** If not verified, redirect to verify page
- **Account Lockout:** After failed attempts

**API Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "identifier": "john@example.com",
  "password": "Password123!",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### Email Verification Flow
- **OTP Input:** 6-digit code
- **Resend OTP:** Available after 60 seconds
- **Expiration:** 15 minutes
- **Max Attempts:** 3 attempts

**API Endpoints:**
- `POST /api/auth/verify-email` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/business/verify-email` - Business verification
- `POST /api/auth/business/resend-otp` - Business resend

### 2.2 Explore & Discovery Flow

#### Search & Filter
- **Search Query:** Text search across name, description
- **Category Filter:** All, Gym, Coaching, Library
- **Location Filter:** City selection or GPS
- **Price Range:** $, $$, $$$
- **Rating Filter:** Minimum rating (1-5)
- **Radius Filter:** Distance in km
- **Availability:** Open now, Available slots
- **Amenities:** Type-specific filters
  - Gym: Equipment, class types, membership types
  - Coaching: Subjects, levels, teaching modes
  - Library: Facilities, collections, space types

**API Endpoint:** `GET /api/venues?category=gym&city=Mumbai&minRating=4&priceRange=$$&radius=10&page=1&limit=12`

**Response:**
```json
{
  "success": true,
  "data": {
    "venues": [ /* venue objects */ ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### Venue Detail View
- **Tabs:** Overview, Pricing, Schedule, Reviews
- **Actions:** Book Now, Buy Membership, Add to Favorites, Share
- **Live Data:** Occupancy, Schedule availability

**API Endpoint:** `GET /api/venues/:id`

### 2.3 Booking Flow

#### Booking Types
1. **One-time Booking**
   - Date selection
   - Time slot selection
   - Duration (minutes)
   - Special requests (optional)
   - Attendees count

2. **Monthly Booking**
   - Month selection
   - Recurring days/times
   - Total price calculation

3. **Membership Purchase**
   - Plan selection (Daily/Weekly/Monthly/Annual)
   - Payment method
   - Auto-renewal option

**API Endpoints:**
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List user bookings
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

**Booking Request:**
```json
{
  "venueId": "g1",
  "date": "2024-12-20",
  "time": "07:00",
  "duration": 90,
  "attendees": 1,
  "specialRequests": "Need chalk for lifting",
  "bookingType": "one_time"
}
```

### 2.4 User Dashboard Flow

#### Dashboard Sections
1. **Home:** Stats, upcoming bookings, quick actions
2. **Profile:** Personal info, preferences, settings
3. **Appointments:** Booking history, upcoming, past
4. **Fees & Payments:** Payment history, methods, invoices

**API Endpoints:**
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update profile
- `GET /api/users/me/bookings` - User bookings
- `GET /api/users/me/payments` - Payment history

### 2.5 Business Dashboard Flow

#### Dashboard Sections
1. **Overview:** Revenue, bookings, members, occupancy
2. **Members:** Member list, add member, assign membership
3. **Appointments:** Manage bookings, schedule, walk-ins
4. **Fees:** Pricing, packages, payment history
5. **Analytics:** Revenue charts, occupancy trends, member stats
6. **Messages:** Customer communications
7. **Settings:** Business profile, subscription, verification

**API Endpoints:**
- `GET /api/business/me` - Business profile
- `PATCH /api/business/me` - Update business
- `GET /api/business/members` - List members
- `POST /api/business/members` - Add member
- `GET /api/business/bookings` - Business bookings
- `GET /api/business/analytics` - Analytics data
- `POST /api/business/announcements` - Send announcement

---

## 3. Data Models & Structures

### 3.1 User Model (Member)
```typescript
{
  id: string (UUID)
  email: string (unique)
  name: string
  phone: string
  avatar: string (URL)
  joinDate: string (ISO date)
  location: {
    lat: number
    lng: number
    address: string
  }
  favorites: string[] (venue IDs)
  bookings: string[] (booking IDs)
  preferences: {
    categories: string[] (gym, coaching, library)
    priceRange: string ($, $$, $$$)
  }
  accountType: 'normal'
  emailVerified: boolean
  phoneVerified: boolean
  marketingConsent: boolean
  lastLogin: string | null
  accountStatus: 'active' | 'suspended' | 'pending_verification'
  failedLoginAttempts: number
  lockedUntil: string | null
}
```

### 3.2 Business User Model
```typescript
{
  id: string (UUID)
  email: string (unique)
  businessName: string
  ownerName: string
  phone: string
  businessType: 'gym' | 'coaching' | 'library'
  registrationNumber: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
    lat?: number
    lng?: number
  }
  subscriptionTier: 'starter' | 'growth' | 'enterprise'
  subscriptionStatus: 'active' | 'trial' | 'expired'
  emailVerified: boolean
  phoneVerified: boolean
  businessVerified: boolean
  verificationStatus: 'pending' | 'verified' | 'rejected'
  accountStatus: 'active' | 'suspended' | 'pending_verification'
  isPublished: boolean
  dailyPackagePrice: number
  weeklyPackagePrice: number
  monthlyPackagePrice: number
  // Type-specific attributes (see mock data)
}
```

### 3.3 Venue Model
```typescript
{
  id: string (UUID)
  name: string
  category: 'gym' | 'coaching' | 'library'
  description: string
  image: string (URL)
  rating: number (1-5)
  reviews: number (count)
  price: number
  priceLabel: string (formatted)
  location: {
    lat: number
    lng: number
    address: string
    city: string
  }
  amenities: string[]
  status: 'available' | 'filling' | 'full'
  occupancy: number
  capacity: number
  verified: boolean
  openNow: boolean
  // Type-specific fields
  subjects?: string[] (coaching)
  equipment?: string[] (gym)
  facilities?: string[] (library)
}
```

### 3.4 Booking Model
```typescript
{
  id: string (UUID)
  userId: string
  venueId: string
  venueType: 'gym' | 'library' | 'coaching'
  date: string (ISO date)
  time: string (HH:mm)
  duration: number (minutes)
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  bookingDate: string (when booked)
  totalPrice: number
  attendees: number
  specialRequests: string
}
```

### 3.5 Review Model
```typescript
{
  id: string (UUID)
  userId: string
  venueId: string
  rating: number (1-5)
  comment: string
  date: string (ISO date)
  helpful: number (count)
  response?: {
    businessReply: string
    date: string
  }
}
```

### 3.6 Notification Model
```typescript
{
  id: string (UUID)
  userId: string
  userType: 'normal' | 'business'
  type: 'booking_confirmation' | 'booking_reminder' | 'review_request' | 'special_offer' | 'new_booking' | 'daily_summary' | 'capacity_alert' | 'review_alert' | 'revenue_milestone' | 'payment_alert'
  title: string
  message: string
  relatedEntity: {
    bookingId?: string
    venueId?: string
    customerId?: string
    reviewId?: string
  }
  actionUrl: string
  actionLabel: string
  priority: 'high' | 'medium' | 'low'
  read: boolean
  createdAt: string (ISO)
  deliveryChannels: string[]
  deliveryStatus: object
}
```

---

## 4. API Expectations

### 4.1 Authentication Endpoints
- `POST /api/auth/member/signup` - Member registration
- `POST /api/auth/business/signup` - Business registration
- `POST /api/auth/login` - Login (email/phone + password)
- `POST /api/auth/verify-email` - Verify email OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/business/verify-email` - Business email verification
- `POST /api/auth/business/resend-otp` - Business resend OTP
- `GET /api/auth/check-email?email=...` - Check email exists
- `GET /api/auth/check-phone?phone=...` - Check phone exists
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout (blacklist token)

### 4.2 Venue Endpoints
- `GET /api/venues` - List venues (with filters, pagination)
- `GET /api/venues/:id` - Get venue details
- `GET /api/venues/:id/schedule` - Get venue schedule
- `GET /api/venues/:id/reviews` - Get venue reviews
- `POST /api/venues/:id/reviews` - Create review (authenticated)
- `GET /api/venues/:id/availability` - Check availability

### 4.3 Booking Endpoints
- `GET /api/bookings` - List user bookings (authenticated)
- `POST /api/bookings` - Create booking (authenticated)
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### 4.4 User Endpoints
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile
- `GET /api/users/me/bookings` - User bookings
- `GET /api/users/me/favorites` - User favorites
- `POST /api/users/me/favorites/:venueId` - Add favorite
- `DELETE /api/users/me/favorites/:venueId` - Remove favorite
- `GET /api/users/me/payments` - Payment history

### 4.5 Business Endpoints
- `GET /api/business/me` - Business profile
- `PATCH /api/business/me` - Update business
- `GET /api/business/members` - List members
- `POST /api/business/members` - Add member
- `GET /api/business/bookings` - Business bookings
- `GET /api/business/analytics` - Analytics data
- `POST /api/business/announcements` - Send announcement

### 4.6 Notification Endpoints
- `GET /api/notifications` - List notifications (authenticated)
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

---

## 5. Validation Rules

### 5.1 Email Validation
- Required format: valid email
- Unique constraint
- Case-insensitive

### 5.2 Password Validation
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### 5.3 Phone Validation
- Format: +971-50-123-4567
- Country code required
- Unique constraint (per country code)

### 5.4 Business Registration Number
- Required
- Format validation (type-specific)
- Unique constraint

---

## 6. Error Handling Expectations

### 6.1 Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

### 6.2 Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `EMAIL_VERIFICATION_REQUIRED` - Email not verified
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Duplicate resource (email/phone exists)
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### 6.3 HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 7. Security Requirements

### 7.1 Authentication
- JWT tokens (access + refresh)
- Access token: 1 hour expiry
- Refresh token: 30 days expiry
- Token blacklisting on logout
- Account lockout after 5 failed attempts (15 min)

### 7.2 Rate Limiting
- Signup: 5 requests per 15 minutes per IP
- Login: 10 requests per 15 minutes per IP
- OTP: 3 requests per 15 minutes per email
- General API: 100 requests per minute per user

### 7.3 Password Security
- Bcrypt hashing (12+ rounds)
- Never return password in responses
- Password reset via OTP

---

## 8. Mock Data Analysis

### 8.1 Data Files
1. **users.json** - 10 member users
2. **businessUsers.json** - 10 business users
3. **gyms.json** - 50 gym venues
4. **coaching.json** - 50 coaching centers
5. **libraries.json** - 50 library venues
6. **bookings.json** - 21 bookings
7. **reviews.json** - 15 reviews
8. **schedules.json** - 10 schedule entries
9. **notifications.json** - 10 notifications

### 8.2 Relationships
- Users → Favorites (venue IDs)
- Users → Bookings (booking IDs)
- Bookings → Venues (venue ID)
- Bookings → Users (user ID)
- Reviews → Venues (venue ID)
- Reviews → Users (user ID)
- Business Users → Venues (locations array)

---

## 9. Business Logic

### 9.1 Booking Logic
- Check venue capacity before booking
- Prevent double-booking for same slot
- Calculate price based on duration and venue pricing
- Auto-cancel if payment not completed (time limit)

### 9.2 Occupancy Tracking
- Real-time occupancy updates
- Capacity alerts at 80% and 90%
- Status: available (<60%), filling (60-85%), full (>85%)

### 9.3 Subscription Tiers
- **Starter:** Basic features, 1 location
- **Growth:** Advanced features, 3 locations, analytics
- **Enterprise:** All features, unlimited locations, priority support

---

## 10. UI/UX Patterns

### 10.1 Loading States
- Skeleton loaders for lists
- Spinner for forms/actions
- Progress indicators for multi-step flows

### 10.2 Error Messages
- Inline validation errors
- Toast notifications for API errors
- Error boundaries for component errors

### 10.3 Success Messages
- Toast notifications for successful actions
- Confirmation dialogs for destructive actions
- Success pages for major flows (signup, booking)

---

## 11. Next Steps for Backend Implementation

1. **Database Schema:** Expand to include venues, bookings, reviews, notifications
2. **Seed Scripts:** Convert all mock data to database seeds
3. **API Endpoints:** Implement all endpoints listed above
4. **Validation:** Add comprehensive input validation
5. **Error Handling:** Standardize error responses
6. **Testing:** Unit and integration tests
7. **Documentation:** API docs, deployment guides

---

**End of Analysis Report**
