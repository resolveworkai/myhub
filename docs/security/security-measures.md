# Security Measures

**Last Updated:** January 2026

## Authentication

### JWT Tokens
- **Access Token:** Short-lived (1 hour), contains user ID, email, account type
- **Refresh Token:** Long-lived (30 days), used to refresh access token
- **Token Storage:** Frontend stores in localStorage
- **Token Blacklisting:** Tokens can be blacklisted on logout

### Password Security
- **Hashing:** Bcrypt with 12+ rounds
- **Password Policy:**
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- **Never stored in plain text**
- **Never returned in API responses**

### Account Lockout
- **Failed Attempts:** 5 failed login attempts
- **Lock Duration:** 15 minutes
- **Auto-unlock:** After lock duration expires
- **Tracking:** `failed_login_attempts` and `locked_until` fields

### Email Verification
- **Required:** Email verification required before login (normal users)
- **OTP:** 6-digit code, expires in 15 minutes
- **Max Attempts:** 3 attempts per OTP
- **Resend:** Available after 60 seconds

---

## Authorization

### Role-Based Access Control
- **User Roles:** `user` (normal), `business_user` (business)
- **Middleware:**
  - `authenticate` - Verifies JWT token
  - `requireBusiness` - Requires business account
  - `requireUser` - Requires normal user account

### Resource Ownership
- Users can only access their own resources
- Business users can only access their own business resources
- Ownership checks in service layer

---

## Input Validation

### Validation Library
- **Joi** for schema validation
- All inputs validated before processing
- Sanitization of user input

### Validation Rules
- Email: Valid email format, case-insensitive
- Phone: Format validation per country
- Password: Strength requirements
- UUID: Valid UUID format
- Dates: ISO date format
- Times: HH:mm format

---

## SQL Injection Prevention

### Parameterized Queries
- **All queries use parameterized statements**
- Never concatenate user input into SQL
- Example:
  ```typescript
  await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  ```

---

## XSS Protection

### Input Sanitization
- All user inputs sanitized
- HTML entities escaped
- JSON responses properly encoded

### Security Headers
- Helmet.js configured
- Content Security Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY

---

## CSRF Protection

### Token-Based
- CSRF tokens for state-changing operations
- SameSite cookie attribute
- Origin validation

---

## Rate Limiting

### Endpoint-Specific Limits
- **Auth endpoints:** 5 requests per 15 minutes per IP
- **OTP endpoints:** 3 requests per 15 minutes per email
- **General API:** 100 requests per minute per user
- **IP-based:** For unauthenticated requests
- **User-based:** For authenticated requests

### Implementation
- `express-rate-limit` middleware
- Different limiters for different endpoint groups
- Custom error responses

---

## Data Protection

### Sensitive Data
- Passwords: Never logged, never returned
- Tokens: Never logged
- Payment info: Encrypted in transit
- Personal data: Only returned to authorized users

### Database
- Soft deletes (deleted_at column)
- Audit logs for important actions
- Encrypted connections (SSL in production)

---

## API Security

### HTTPS
- **Required in production**
- SSL/TLS encryption
- Certificate validation

### CORS
- Whitelist of allowed origins
- Credentials support
- Preflight request handling

### Request Size Limits
- JSON body: 10MB max
- URL-encoded: 10MB max
- Prevents DoS attacks

---

## Error Handling

### Error Messages
- **Development:** Detailed error messages with stack traces
- **Production:** Generic error messages, no stack traces
- **Never expose:** Database errors, internal paths, system info

### Error Logging
- All errors logged server-side
- Sensitive data excluded from logs
- Error tracking for monitoring

---

## Session Management

### Token Expiry
- Access tokens expire after 1 hour
- Refresh tokens expire after 30 days
- Automatic token refresh on expiry

### Inactivity Timeout
- Frontend tracks user activity
- Auto-logout after inactivity (30 min for users, 60 min for business)

---

## Security Headers

### Helmet.js Configuration
- Content Security Policy
- X-DNS-Prefetch-Control
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

---

## Audit Logging

### Tracked Actions
- User signup
- Login attempts
- Email verification
- Password changes
- Account status changes
- Important business operations

### Log Fields
- User ID and type
- Action type
- Resource type and ID
- IP address
- User agent
- Timestamp
- Metadata (JSONB)

---

## Best Practices

1. ✅ **Never trust client input** - Always validate
2. ✅ **Use parameterized queries** - Prevent SQL injection
3. ✅ **Hash passwords** - Never store plain text
4. ✅ **Rate limit everything** - Prevent abuse
5. ✅ **Log security events** - Audit trail
6. ✅ **Use HTTPS** - Encrypt in transit
7. ✅ **Validate tokens** - Check expiry and signature
8. ✅ **Sanitize output** - Prevent XSS
9. ✅ **Principle of least privilege** - Minimal permissions
10. ✅ **Regular security updates** - Keep dependencies updated

---

## Security Checklist

- [x] JWT authentication implemented
- [x] Password hashing (bcrypt)
- [x] Account lockout
- [x] Email verification
- [x] Rate limiting
- [x] Input validation
- [x] SQL injection prevention
- [x] XSS protection
- [x] CSRF protection
- [x] Security headers
- [x] Error handling
- [x] Audit logging
- [x] HTTPS enforcement (production)
- [x] CORS configuration

---

**For deployment security, see [Deployment Guide](../deployment/setup-guide.md)**
