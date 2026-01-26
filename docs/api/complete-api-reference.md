# Complete API Reference

**Base URL:** `http://localhost:3001/api` (Development)  
**Version:** 1.0.0  
**Last Updated:** January 2026

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

---

## Authentication Endpoints

### POST /api/auth/member/signup
Create a new member account.

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

**Response (201):**
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

---

### POST /api/auth/business/signup
Create a new business account.

**Request:**
```json
{
  "businessName": "Fitness Center",
  "businessType": "gym",
  "registrationNumber": "DXB-GYM-2024-001",
  "yearsInOperation": "3-5 years",
  "ownerName": "Jane Smith",
  "email": "business@example.com",
  "phone": "501234567",
  "countryCode": "+971",
  "website": "https://fitness.com",
  "address": {
    "street": "123 Business St",
    "city": "Dubai",
    "state": "Dubai",
    "postalCode": "00000",
    "country": "UAE",
    "lat": 25.2048,
    "lng": 55.2708
  },
  "numberOfLocations": "1 location",
  "totalCapacity": 100,
  "specialties": ["hiit", "strength"],
  "serviceAreas": "Fitness training",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "accountManagerEmail": "manager@example.com",
  "subscriptionTier": "starter",
  "acceptTerms": true,
  "acceptPrivacy": true,
  "verificationConsent": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Business account created! Your account is pending verification.",
  "data": {
    "userId": "uuid",
    "email": "business@example.com"
  }
}
```

---

### POST /api/auth/login
Login with email/phone and password.

**Request:**
```json
{
  "identifier": "john@example.com",
  "password": "Password123!",
  "rememberMe": false
}
```

**Response (200):**
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

---

### POST /api/auth/verify-email
Verify email with OTP.

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### POST /api/auth/resend-otp
Resend OTP code.

**Request:**
```json
{
  "email": "john@example.com"
}
```

---

### GET /api/auth/check-email?email=...
Check if email exists.

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true
  }
}
```

---

### GET /api/auth/check-phone?phone=...
Check if phone exists.

---

## Venue Endpoints

### GET /api/venues
List venues with filters and pagination.

**Query Parameters:**
- `category` - gym, coaching, library, or all
- `city` - Filter by city
- `minRating` - Minimum rating (0-5)
- `priceRange` - Symbolic: $, $$, or $$$ | Numeric range: "min,max" (e.g., "0,50000")
- `radius` - Distance in km (requires userLat/userLng)
- `userLat` - User latitude
- `userLng` - User longitude
- `search` - Search query
- `amenities` - Comma-separated amenities
- `status` - available, filling, full, or all
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12, max: 100)

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

---

### GET /api/venues/:id
Get venue details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "FitZone Premium Gym",
    "category": "gym",
    "description": "...",
    "image": "https://...",
    "rating": 4.8,
    "reviews": 156,
    "price": 2500,
    "priceLabel": "₹2,500/month",
    "location": {
      "lat": 19.076,
      "lng": 72.8777,
      "address": "Andheri West, Mumbai",
      "city": "Mumbai"
    },
    "amenities": ["wifi", "parking", "ac"],
    "status": "available",
    "occupancy": 45,
    "capacity": 100,
    "verified": true,
    "openNow": true
  }
}
```

---

### GET /api/venues/:id/schedule?date=2024-12-20
Get venue schedule for a date.

---

### GET /api/venues/:id/reviews?page=1&limit=10
Get venue reviews.

---

### GET /api/venues/:id/availability?date=2024-12-20&time=07:00
Check venue availability for a time slot.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "availableSlots": 15,
    "totalSlots": 100,
    "status": "available"
  }
}
```

---

## Booking Endpoints

### POST /api/bookings
Create a new booking. **Requires Authentication**

**Request:**
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

**Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "venueId": "g1",
    "date": "2024-12-20",
    "time": "07:00",
    "duration": 90,
    "status": "confirmed",
    "totalPrice": 75.0,
    "attendees": 1
  }
}
```

---

### GET /api/bookings
Get user bookings. **Requires Authentication**

**Query Parameters:**
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

---

### GET /api/bookings/:id
Get booking details. **Requires Authentication**

---

### PATCH /api/bookings/:id
Update booking. **Requires Authentication**

**Request:**
```json
{
  "date": "2024-12-21",
  "time": "08:00",
  "duration": 120,
  "attendees": 2
}
```

---

### DELETE /api/bookings/:id
Cancel booking. **Requires Authentication**

**Request:**
```json
{
  "reason": "Change of plans"
}
```

---

### GET /api/bookings/business/all
Get business bookings. **Requires Business Account**

---

## Review Endpoints

### POST /api/reviews
Create review. **Requires Authentication**

**Request:**
```json
{
  "venueId": "g1",
  "bookingId": "b1",
  "rating": 5,
  "comment": "Great gym with excellent facilities!"
}
```

---

### PATCH /api/reviews/:id
Update review. **Requires Authentication**

---

### DELETE /api/reviews/:id
Delete review. **Requires Authentication**

---

### POST /api/reviews/:id/reply
Add business reply to review. **Requires Business Account**

**Request:**
```json
{
  "reply": "Thank you for your feedback! We're glad you enjoyed your experience."
}
```

---

## User Endpoints

### GET /api/users/me
Get current user profile. **Requires Authentication**

---

### PATCH /api/users/me
Update user profile. **Requires Authentication**

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+971-50-123-4567",
  "location": {
    "lat": 25.2048,
    "lng": 55.2708,
    "address": "Dubai, UAE"
  },
  "preferences": {
    "categories": ["gym", "coaching"],
    "priceRange": "$$"
  }
}
```

---

### GET /api/users/me/favorites
Get user favorites. **Requires Authentication**

---

### POST /api/users/me/favorites/:venueId
Add favorite. **Requires Authentication**

---

### DELETE /api/users/me/favorites/:venueId
Remove favorite. **Requires Authentication**

---

### GET /api/users/me/payments
Get payment history. **Requires Authentication**

---

### POST /api/users/me/change-password
Change password. **Requires Authentication**

**Request:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

---

## Business Endpoints

### GET /api/business/me
Get business profile. **Requires Business Account**

---

### PATCH /api/business/me
Update business profile. **Requires Business Account**

---

### GET /api/business/members
Get business members. **Requires Business Account**

---

### POST /api/business/members
Add business member. **Requires Business Account**

**Request:**
```json
{
  "userId": "uuid",
  "notes": "VIP member"
}
```

---

### GET /api/business/dashboard/stats
Get business dashboard statistics. **Requires Business Account**

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 45,
    "revenueThisMonth": 12500.00,
    "appointmentsToday": 8,
    "pendingPayments": 500.00
  }
}
```

---

### GET /api/business/analytics?period=month
Get business analytics. **Requires Business Account**

**Query Parameters:**
- `period` - week, month, or year

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": {
      "total": 150,
      "revenue": 37500.0
    },
    "members": {
      "total": 45
    },
    "venues": {
      "total": 3
    },
    "reviews": {
      "averageRating": 4.7,
      "total": 89
    },
    "occupancy": {
      "average": 0.65
    }
  }
}
```

---

### POST /api/business/announcements
Send announcement to members. **Requires Business Account**

**Request:**
```json
{
  "title": "Special Offer",
  "message": "Get 20% off this month!",
  "memberIds": ["uuid1", "uuid2"] // Optional - sends to all if omitted
}
```

---

## Business Settings Endpoints

### PATCH /api/business/settings/business-info
Update business information. **Requires Business Account**

**Request:**
```json
{
  "businessName": "Fitness Center",
  "email": "business@example.com",
  "phone": "+971501234567",
  "website": "https://fitness.com",
  "address": "123 Business St",
  "description": "Premium fitness center with state-of-the-art equipment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Business information updated successfully",
  "data": { /* business object */ }
}
```

---

### PATCH /api/business/settings/location-media
Update location and media. **Requires Business Account**

**Request:**
```json
{
  "lat": 25.2048,
  "lng": 55.2708,
  "logo": "https://example.com/logo.jpg",
  "coverImage": "https://example.com/cover.jpg",
  "galleryImages": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
}
```

---

### PATCH /api/business/settings/attributes
Update business attributes. **Requires Business Account**

**Request:**
```json
{
  "amenities": ["wifi", "parking", "ac"],
  "equipment": ["treadmill", "weights", "yoga mats"],
  "classTypes": ["hiit", "yoga", "pilates"],
  "membershipOptions": ["daily", "weekly", "monthly"]
}
```

---

### PATCH /api/business/settings/pricing
Update membership package pricing. **Requires Business Account**

**Request:**
```json
{
  "dailyPackagePrice": 299,
  "weeklyPackagePrice": 1499,
  "monthlyPackagePrice": 4999
}
```

---

### PATCH /api/business/settings/operating-hours
Update operating hours. **Requires Business Account**

**Request:**
```json
{
  "monday": { "open": "06:00", "close": "22:00", "closed": false },
  "tuesday": { "open": "06:00", "close": "22:00", "closed": false },
  "wednesday": { "open": "06:00", "close": "22:00", "closed": false },
  "thursday": { "open": "06:00", "close": "22:00", "closed": false },
  "friday": { "open": "06:00", "close": "22:00", "closed": false },
  "saturday": { "open": "08:00", "close": "20:00", "closed": false },
  "sunday": { "open": "08:00", "close": "18:00", "closed": false }
}
```

---

### PATCH /api/business/settings/notifications
Update notification preferences. **Requires Business Account**

**Request:**
```json
{
  "emailBookings": true,
  "emailPayments": true,
  "emailReminders": true,
  "smsBookings": false,
  "smsPayments": true,
  "pushNotifications": true
}
```

---

### PATCH /api/business/settings/security
Update security settings. **Requires Business Account**

**Request:**
```json
{
  "twoFactor": false,
  "sessionTimeout": "30"
}
```

---

### PATCH /api/business/settings/publish
Toggle publish status. **Requires Business Account**

**Request:**
```json
{
  "isPublished": true
}
```

---

## Notification Endpoints

### GET /api/notifications
Get user notifications. **Requires Authentication**

**Query Parameters:**
- `read` - true/false to filter by read status
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [ /* notification objects */ ],
    "pagination": { /* pagination info */ },
    "unreadCount": 5
  }
}
```

---

### PATCH /api/notifications/:id/read
Mark notification as read. **Requires Authentication**

---

### PATCH /api/notifications/read-all
Mark all notifications as read. **Requires Authentication**

---

### DELETE /api/notifications/:id
Delete notification. **Requires Authentication**

---

## Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Duplicate resource
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EMAIL_VERIFICATION_REQUIRED` - Email not verified
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

- **Auth endpoints:** 5 requests per 15 minutes per IP
- **General API:** 100 requests per minute per user
- **OTP endpoints:** 3 requests per 15 minutes per email

---

**End of API Reference**
