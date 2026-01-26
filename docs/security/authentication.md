# Authentication Documentation

**Last Updated:** January 25, 2026

## Overview

The backend uses JWT (JSON Web Tokens) for authentication with access and refresh tokens.

## Authentication Flow

### Member Signup Flow

1. User submits signup form
2. Backend validates input
3. Password is hashed with bcrypt (12 rounds)
4. User record created in database
5. OTP generated and sent via email
6. User redirected to email verification page
7. User enters OTP
8. Email verified, account activated

### Business Signup Flow

1. Business submits signup form (5 steps)
2. Backend validates input
3. Email duplicate check (real-time validation on frontend)
4. Password is hashed with bcrypt (12 rounds)
5. Business user record created with pending_verification status
6. OTP generated and sent via email
7. Admin notification sent
8. **User redirected to OTP verification page** (new step)
9. User verifies email with OTP
10. After OTP verification, user redirected to Business Verification Pending page
11. Account remains pending until admin approval

### Login Flow

1. User submits credentials (email/phone + password)
2. Backend finds user by email or phone
3. Checks account lock status
4. Verifies password with bcrypt
5. Checks account status
6. For normal users, verifies email is verified
7. Generates JWT access and refresh tokens
8. Returns user data and tokens (including `account_type` field: 'user' or 'business_user' for role-based routing)
9. Frontend maps `account_type` to `accountType` ('normal' or 'business') and redirects:
   - Member/User (`account_type: 'user'`) → `/dashboard`
   - Business Owner (`account_type: 'business_user'`) → `/business-dashboard`

## JWT Tokens

### Access Token
- Purpose: Short-lived token for API requests
- Expiry: 15 minutes
- Secret: JWT_SECRET

### Refresh Token
- Purpose: Long-lived token for obtaining new access tokens
- Expiry: 7 days
- Secret: JWT_REFRESH_SECRET

## Password Security

### Hashing
- Algorithm: bcrypt
- Rounds: 12
- Storage: Only hashed passwords stored

### Requirements
- Minimum 8 characters
- At least one uppercase, lowercase, number, special character

## Account Lockout

- Max Attempts: 5
- Lockout Duration: 15 minutes
- Behavior: Failed attempts tracked, account locked after threshold

## Email Verification

### OTP Generation
- Length: 6 digits
- Expiry: 10 minutes
- Max Attempts: 3

### OTP Verification Endpoints
- **Generic:** `/api/auth/verify-email` - Works for both member and business users
- **Business-specific:** `/api/auth/business/verify-email` - Business-specific endpoint
- **Resend OTP:** `/api/auth/resend-otp` (generic) or `/api/auth/business/resend-otp` (business)

### Business OTP Flow
1. Business account created → OTP sent to email
2. User redirected to `/verify-email?email=...&type=business`
3. User enters 6-digit OTP
4. OTP verified → Email marked as verified
5. User redirected to `/business-dashboard/pending` (verification pending page)
6. Account remains in `pending_verification` status until admin approval

## Security Measures

- Rate Limiting: 5 requests per 15 minutes for auth endpoints
- SQL Injection Prevention: Parameterized queries only
- XSS Protection: Helmet.js security headers
- CORS: Configurable allowed origins
