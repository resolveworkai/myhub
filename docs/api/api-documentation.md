# API Documentation

**Last Updated:** January 25, 2026

## Changelog

### January 25, 2026
- Added business-specific OTP verification endpoints (`/business/verify-email`, `/business/resend-otp`)
- Enhanced email duplicate check for business signup
- Updated login response to include user role for dashboard routing

## Base URL

- Development: `http://localhost:3001/api`
- Production: `https://api.portal.com/api`

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "message": "Optional message",
  "data": {},
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

## Endpoints

### Authentication

#### POST /api/auth/member/signup

Create a new member account.

**Authentication:** Not required

**Request Body:**
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

**Error Responses:**
- `400` - Validation error
- `409` - Email or phone already exists
- `429` - Rate limit exceeded

**Rate Limiting:** 5 requests per 15 minutes

---

#### POST /api/auth/business/signup

Create a new business account.

**Authentication:** Not required

**Request Body:**
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

**Error Responses:**
- `400` - Validation error
- `409` - Email already exists
- `429` - Rate limit exceeded

**Rate Limiting:** 5 requests per 15 minutes

---

#### POST /api/auth/login

Login with email/phone and password.

**Authentication:** Not required

**Request Body:**
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
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "account_type": "user"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials or email verification required
- `429` - Rate limit exceeded

**Special Response (401 with requiresVerification):**
```json
{
  "success": false,
  "error": {
    "message": "Please verify your email before signing in...",
    "code": "EMAIL_VERIFICATION_REQUIRED"
  },
  "requiresVerification": true
}
```

**Rate Limiting:** 5 requests per 15 minutes

---

#### POST /api/auth/verify-email

Verify email with OTP code.

**Authentication:** Not required

**Request Body:**
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

**Error Responses:**
- `400` - Invalid OTP or expired
- `404` - OTP not found
- `429` - Rate limit exceeded

**Rate Limiting:** 5 requests per 15 minutes

---

#### POST /api/auth/resend-otp

Resend verification OTP.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "A new verification code has been sent to your email."
}
```

**Error Responses:**
- `400` - Validation error
- `429` - Rate limit exceeded

**Rate Limiting:** 5 requests per 15 minutes

---

#### GET /api/auth/check-email

Check if email exists.

**Authentication:** Not required

**Query Parameters:**
- `email` (required) - Email address to check

**Response (200):**
```json
{
  "success": true,
  "data": {
    "exists": true
  }
}
```

---

#### POST /api/auth/business/verify-email

Verify business email with OTP code. Business-specific endpoint for email verification.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "business@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Business email verified successfully"
}
```

**Error Responses:**
- `400` - Invalid OTP or expired
- `404` - OTP not found
- `429` - Rate limit exceeded

**Rate Limiting:** 5 requests per 15 minutes

**Notes:**
- Works for business users only
- After verification, business account remains in 'pending_verification' status until admin approval
- OTP expires after 10 minutes
- Maximum 3 verification attempts per OTP

---

#### POST /api/auth/business/resend-otp

Resend verification OTP for business email. Business-specific endpoint.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "business@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "A new verification code has been sent to your business email."
}
```

**Error Responses:**
- `400` - Validation error
- `429` - Rate limit exceeded

**Rate Limiting:** 5 requests per 15 minutes

**Notes:**
- Rate limited to prevent abuse
- New OTP invalidates previous unverified OTPs for the same email
- OTP expiry: 10 minutes

---

#### GET /api/auth/check-phone

Check if phone exists.

**Authentication:** Not required

**Query Parameters:**
- `phone` (required) - Phone number to check

**Response (200):**
```json
{
  "success": true,
  "data": {
    "exists": false
  }
}
```

---

### Health Check

#### GET /health

Health check endpoint.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T10:00:00.000Z",
  "uptime": 3600
}
```

---

#### GET /ready

Readiness check (includes database connection).

**Response (200):**
```json
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-01-25T10:00:00.000Z"
}
```

**Response (503):**
```json
{
  "status": "not ready",
  "database": "disconnected",
  "timestamp": "2026-01-25T10:00:00.000Z"
}
```

---

## Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Access denied
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., email exists)
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EMAIL_VERIFICATION_REQUIRED` - Email verification needed
- `INTERNAL_SERVER_ERROR` - Server error

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

Rate limit headers:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset time

## Sample cURL Requests

### Member Signup
```bash
curl -X POST http://localhost:3001/api/auth/member/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "501234567",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "acceptTerms": true,
    "acceptPrivacy": true
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",
    "password": "Password123!"
  }'
```

### Verify Email
```bash
curl -X POST http://localhost:3001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'
```
