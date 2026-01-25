# Folder Structure Documentation

**Last Updated:** January 25, 2026

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   └── index.ts         # Environment configuration
│   ├── controllers/         # Request handlers
│   │   └── authController.ts
│   ├── db/                  # Database connection and migrations
│   │   ├── pool.ts          # PostgreSQL connection pool
│   │   ├── migrate.ts       # Migration runner
│   │   └── migrations/      # SQL migration files
│   │       └── 001_initial_schema.sql
│   ├── middleware/           # Custom middleware
│   │   ├── errorHandler.ts  # Error handling middleware
│   │   ├── rateLimiter.ts   # Rate limiting middleware
│   │   ├── security.ts      # Security middleware (helmet, CORS)
│   │   └── validation.ts    # Request validation middleware
│   ├── routes/              # API routes
│   │   ├── authRoutes.ts    # Authentication routes
│   │   └── healthRoutes.ts  # Health check routes
│   ├── services/            # Business logic
│   │   ├── authService.ts   # Authentication service
│   │   ├── emailService.ts  # Email service
│   │   └── otpService.ts     # OTP service
│   ├── utils/               # Helper functions
│   │   ├── errors.ts        # Custom error classes
│   │   └── logger.ts        # Winston logger
│   ├── validators/          # Input validation schemas
│   │   └── authValidators.ts # Joi validation schemas
│   └── server.ts            # Express app entry point
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Layer Architecture

### Routes Layer
- **Purpose:** Define API endpoints and HTTP methods
- **Responsibilities:**
  - Route definition
  - Middleware application (rate limiting, validation)
  - Controller mapping

**Example:**
```typescript
router.post('/member/signup', authRateLimiter, validate(schema), controller);
```

### Controllers Layer
- **Purpose:** Handle HTTP requests and responses
- **Responsibilities:**
  - Extract request data
  - Call service methods
  - Format responses
  - Handle errors

**Example:**
```typescript
export const memberSignup = asyncHandler(async (req, res) => {
  const result = await authService.memberSignup(data);
  res.status(201).json({ success: true, data: result });
});
```

### Services Layer
- **Purpose:** Business logic implementation
- **Responsibilities:**
  - Business rules
  - Data transformations
  - Transaction management
  - External service calls

**Example:**
```typescript
async memberSignup(data: MemberSignupData): Promise<Result> {
  // Business logic here
  await client.query('BEGIN');
  // ... operations
  await client.query('COMMIT');
}
```

### Data Access Layer
- **Purpose:** Database operations
- **Responsibilities:**
  - SQL queries
  - Connection management
  - Query optimization

**Example:**
```typescript
const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
```

## Middleware Execution Order

1. **Security Middleware** (helmet, CORS)
2. **Body Parsing** (JSON, URL-encoded)
3. **Compression**
4. **Request Logging**
5. **Rate Limiting**
6. **Route-specific Middleware** (validation, auth)
7. **Controller**
8. **Error Handler**

## Dependency Flow

```
Request → Routes → Middleware → Controllers → Services → Database
                                                      ↓
Response ← Routes ← Controllers ← Services ← Database
```

## File Responsibilities

### config/index.ts
- Loads environment variables
- Validates required configuration
- Exports typed configuration object

### db/pool.ts
- Creates PostgreSQL connection pool
- Handles connection errors
- Graceful shutdown

### services/authService.ts
- Authentication business logic
- Password hashing/verification
- JWT token generation
- Account management

### services/emailService.ts
- Email sending via nodemailer
- OTP email templates
- Business verification notifications

### services/otpService.ts
- OTP generation
- OTP storage and verification
- Expiry management

### utils/errors.ts
- Custom error classes
- Error response formatting
- Error classification

### utils/logger.ts
- Winston logger configuration
- Log levels and formatting
- File and console transports

### middleware/validation.ts
- Joi schema validation
- Request sanitization
- Error formatting

### middleware/rateLimiter.ts
- Express rate limit configuration
- Different limits for auth vs general endpoints

### middleware/security.ts
- Helmet security headers
- CORS configuration
- Request logging

## Best Practices

1. **Separation of Concerns:** Each layer has a single responsibility
2. **Error Handling:** Errors bubble up through layers, handled at top level
3. **Transaction Management:** Services manage database transactions
4. **Validation:** Input validated at route level before reaching services
5. **Logging:** Structured logging at service and controller levels
6. **Type Safety:** TypeScript strict mode enabled throughout
