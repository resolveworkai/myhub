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
3. Password is hashed with bcrypt (12 rounds)
4. Business user record created with pending_verification status
5. OTP generated and sent via email
6. Admin notification sent
7. User redirected to pending verification page
8. User verifies email with OTP
9. Account remains pending until admin approval

### Login Flow

1. User submits credentials (email/phone + password)
2. Backend finds user by email or phone
3. Checks account lock status
4. Verifies password with bcrypt
5. Checks account status
6. For normal users, verifies email is verified
7. Generates JWT access and refresh tokens
8. Returns user data and tokens

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

## Security Measures

- Rate Limiting: 5 requests per 15 minutes for auth endpoints
- SQL Injection Prevention: Parameterized queries only
- XSS Protection: Helmet.js security headers
- CORS: Configurable allowed origins
