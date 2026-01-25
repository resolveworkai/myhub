# Backend Architecture

**Last Updated:** January 2026

## Overview

The backend follows a layered architecture pattern with clear separation of concerns:

```
Request → Routes → Middleware → Controllers → Services → Database
```

## Architecture Layers

### 1. Routes Layer (`src/routes/`)
- Define API endpoints
- Apply middleware (auth, validation, rate limiting)
- Route requests to controllers

**Files:**
- `authRoutes.ts` - Authentication endpoints
- `venueRoutes.ts` - Venue endpoints
- `bookingRoutes.ts` - Booking endpoints
- `reviewRoutes.ts` - Review endpoints
- `userRoutes.ts` - User endpoints
- `businessRoutes.ts` - Business endpoints
- `notificationRoutes.ts` - Notification endpoints
- `healthRoutes.ts` - Health check endpoints

### 2. Middleware Layer (`src/middleware/`)
- **auth.ts** - JWT authentication, role-based access
- **validation.ts** - Input validation with Joi
- **errorHandler.ts** - Global error handling
- **rateLimiter.ts** - Rate limiting
- **security.ts** - Security headers (Helmet, CORS)

### 3. Controllers Layer (`src/controllers/`)
- Parse requests
- Call service layer
- Format responses
- Handle errors

**Files:**
- `authController.ts`
- `venueController.ts`
- `bookingController.ts`
- `reviewController.ts`
- `userController.ts`
- `businessController.ts`
- `notificationController.ts`

### 4. Services Layer (`src/services/`)
- Business logic
- Data validation
- Database operations
- External service calls
- Transaction management

**Files:**
- `authService.ts` - Authentication, signup, login
- `venueService.ts` - Venue operations, filtering
- `bookingService.ts` - Booking management
- `reviewService.ts` - Review operations
- `userService.ts` - User profile management
- `businessService.ts` - Business operations
- `notificationService.ts` - Notification management
- `emailService.ts` - Email sending
- `otpService.ts` - OTP generation and verification

### 5. Database Layer (`src/db/`)
- Connection pooling
- Migrations
- Query execution

**Files:**
- `pool.ts` - PostgreSQL connection pool
- `migrations/` - SQL migration files

### 6. Utilities (`src/utils/`)
- Error classes
- Logger
- Helper functions

## Request Flow

```
1. HTTP Request
   ↓
2. Security Middleware (Helmet, CORS)
   ↓
3. Body Parser
   ↓
4. Rate Limiter
   ↓
5. Request Logger
   ↓
6. Route Handler
   ↓
7. Authentication Middleware (if protected)
   ↓
8. Validation Middleware (if needed)
   ↓
9. Controller
   ↓
10. Service (Business Logic)
   ↓
11. Database Query
   ↓
12. Response Formatter
   ↓
13. Error Handler (if error)
   ↓
14. HTTP Response
```

## Error Handling

### Error Classes
- `AppError` - Base error class
- `ValidationError` - Input validation errors
- `AuthenticationError` - Auth failures
- `AuthorizationError` - Permission errors
- `NotFoundError` - Resource not found
- `ConflictError` - Duplicate resources
- `InternalError` - Server errors

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

## Security Measures

### Authentication
- JWT tokens (access + refresh)
- Token blacklisting on logout
- Account lockout after failed attempts
- Email verification required

### Authorization
- Role-based access control (user, business_user)
- Resource ownership checks
- Middleware: `authenticate`, `requireBusiness`, `requireUser`

### Input Validation
- Joi schemas for all inputs
- Sanitization of user input
- SQL injection prevention (parameterized queries only)

### Rate Limiting
- General API: 100 requests/minute
- Auth endpoints: 5 requests/15 minutes
- OTP endpoints: 3 requests/15 minutes

### Security Headers
- Helmet.js for security headers
- CORS with whitelist
- Content Security Policy

## Database Transactions

All multi-step operations use database transactions:

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... operations ...
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## Logging

Winston logger with:
- File logging (rotating)
- Console logging (development)
- Error logging (separate file)
- Request logging

## Configuration

Centralized configuration in `src/config/index.ts`:
- Environment variables
- Database settings
- JWT settings
- Email settings
- Rate limiting
- Security settings

## Testing Strategy

### Unit Tests
- Service layer functions
- Utility functions
- Validation functions

### Integration Tests
- API endpoints
- Database operations
- Authentication flows

## Performance Optimizations

- Database connection pooling
- Indexed queries
- Pagination for list endpoints
- Response compression
- Query optimization (avoid N+1)

## Deployment

### Environment Variables
All configuration via environment variables (see `.env.example`)

### Database Migrations
Run migrations before deployment:
```bash
npm run migrate:up
```

### Health Checks
- `/health` - Basic health check
- `/ready` - Readiness check (includes DB connection)

---

**For detailed API documentation, see [Complete API Reference](../api/complete-api-reference.md)**
