# Business Logic Workflows

**Last Updated:** January 25, 2026

## Member Signup Workflow

### Step 1: Personal Information
- Collect: fullName, email, phone, countryCode, location (optional)
- Validate: Name format, email format, phone format
- Check: Email/phone uniqueness

### Step 2: Security
- Collect: password, confirmPassword
- Validate: Password strength requirements
- Hash: Password with bcrypt (12 rounds)

### Step 3: Preferences
- Collect: categories, acceptTerms, acceptPrivacy, marketingConsent
- Validate: Terms and privacy acceptance required

### Step 4: Account Creation
- Transaction: Begin database transaction
- Insert: User record with hashed password
- Generate: OTP for email verification
- Send: Verification email
- Audit: Log signup event
- Commit: Transaction

### Step 5: Email Verification
- User receives OTP via email
- User enters OTP
- Verify: OTP code, expiry, attempts
- Update: email_verified = TRUE
- Complete: Signup process

## Business Signup Workflow

### Step 1: Business Information
- Collect: businessName, businessType, registrationNumber, yearsInOperation
- Validate: All fields required, businessType enum

### Step 2: Contact Information
- Collect: ownerName, email, phone, website, address
- Validate: Email format, address completeness
- Check: Email uniqueness (real-time validation on email field blur)
- Frontend: Shows error if email already exists, prevents form submission

### Step 3: Business Details
- Collect: numberOfLocations, totalCapacity, specialties, serviceAreas
- Validate: Capacity > 0, specialties array

### Step 4: Security
- Collect: password, confirmPassword, accountManagerEmail (optional)
- Validate: Password strength
- Hash: Password with bcrypt

### Step 5: Subscription
- Collect: subscriptionTier, acceptTerms, acceptPrivacy, verificationConsent
- Validate: All consents required

### Step 6: Account Creation
- Transaction: Begin database transaction
- Insert: Business user record with status 'pending_verification'
- Generate: OTP for email verification
- Send: Verification email
- Notify: Admin of new business registration
- Audit: Log signup event
- Commit: Transaction
- Frontend: Redirect to OTP verification page (`/verify-email?email=...&type=business`)

### Step 7: Email Verification (OTP Page)
- User redirected to OTP verification page
- User enters 6-digit OTP code
- Frontend calls: `POST /api/auth/business/verify-email` or `/api/auth/verify-email`
- Backend validates OTP (checks expiry, attempts, code match)
- Updates: email_verified = TRUE in business_users table
- Frontend: Redirects to Business Verification Pending page (`/business-dashboard/pending`)
- Account remains in 'pending_verification' status (admin approval still required)

### Step 8: Admin Verification

### Step 8: Admin Verification
- Admin reviews business details
- Admin approves or rejects
- If approved: account_status = 'active', business_verified = TRUE
- If rejected: account_status = 'suspended', verification_status = 'rejected'

## Login Workflow

### Step 1: Credential Submission
- User submits: identifier (email/phone), password

### Step 2: User Lookup
- Determine: Email or phone identifier
- Query: Find user in users or business_users table
- Check: User exists

### Step 3: Account Status Checks
- Check: Account lock status (locked_until)
- Check: Account status (active, suspended, pending_verification)
- Check: Business verification status (if business user)

### Step 4: Password Verification
- Compare: Submitted password with stored hash
- Handle: Failed attempts (increment counter, lock if threshold reached)

### Step 5: Email Verification Check
- For normal users: Verify email_verified = TRUE
- If not verified: Generate new OTP, send email, return error

### Step 6: Success
- Reset: Failed attempts counter
- Update: last_login timestamp
- Generate: JWT access and refresh tokens
- Return: User data and tokens (including account_type: 'user' or 'business_user')
- Audit: Log login event
- Frontend: Store tokens in localStorage
- Frontend: Redirect based on account_type:
  - Member/User → `/dashboard` or `/user-dashboard`
  - Business Owner → `/business-dashboard`

## OTP Verification Workflow

### Step 1: OTP Generation
- Generate: Random 6-digit code
- Calculate: Expiry time (current time + 10 minutes)
- Store: OTP in database with email, type, expiry
- Send: Email with OTP code

### Step 2: OTP Verification
- User submits: email, otp
- Lookup: Latest unverified OTP for email and type
- Check: OTP exists
- Check: Not expired
- Check: Attempts < max (3)
- Verify: OTP code matches
- Mark: OTP as verified
- Update: Email verification status in user table

### Step 3: Resend OTP
- Delete: Existing unverified OTPs
- Generate: New OTP
- Send: New email

## Data Transformations

### Member Signup Data Transformation
```
Frontend → Backend
fullName → name
location.lat → location_lat
location.lng → location_lng
location.address → location_address
categories → preferences_categories
```

### Business Signup Data Transformation
```
Frontend → Backend
address.street → address_street
address.city → address_city
address.state → address_state
address.postalCode → address_postal_code
address.country → address_country
address.lat → address_lat
address.lng → address_lng
```

### Login Response Transformation
```
Backend → Frontend
account_type → accountType
email_verified → emailVerified
phone_verified → phoneVerified
business_verified → businessVerified
account_status → accountStatus
failed_login_attempts → failedLoginAttempts
locked_until → lockedUntil
```

## Transaction Management

### Signup Transactions
- All database operations in single transaction
- Rollback on any error
- Commit only after all operations succeed

### Login Transactions
- Account status updates in transaction
- Failed attempt tracking in transaction
- Last login update in transaction

## Error Handling

### Validation Errors
- Return 400 with specific field errors
- Do not proceed with operation

### Business Logic Errors
- Return appropriate HTTP status
- Include error code for frontend handling
- Log error for debugging

### Database Errors
- Rollback transaction
- Return 500 error to client
- Log detailed error information
