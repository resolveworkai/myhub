# Portal Backend API

Enterprise-grade Node.js + TypeScript + PostgreSQL backend for Portal.

## Features

- ✅ TypeScript with strict types
- ✅ Complete error handling
- ✅ Input validation (Joi)
- ✅ Security: bcrypt (12+ rounds), JWT (access+refresh), rate limiting, SQL injection prevention, XSS protection
- ✅ Environment-based configuration
- ✅ Database transactions
- ✅ Email service with OTP (6 digits, 10min expiry)
- ✅ Structured logging (Winston)
- ✅ Health check endpoints
- ✅ Database indexing
- ✅ Connection pooling
- ✅ Graceful shutdown
- ✅ Rate limiting on auth endpoints
- ✅ Account lockout after failed attempts
- ✅ Audit logs

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

3. **Create database:**
   ```sql
   CREATE DATABASE portal_db;
   ```

4. **Run migrations:**
   ```bash
   npm run migrate
   ```
   Or manually run the SQL file:
   ```bash
   psql -U postgres -d portal_db -f src/db/migrations/001_initial_schema.sql
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/member/signup` - Member signup
- `POST /api/auth/business/signup` - Business signup
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/check-email?email=...` - Check if email exists
- `GET /api/auth/check-phone?phone=...` - Check if phone exists

### Health

- `GET /health` - Health check
- `GET /ready` - Readiness check (includes DB connection)

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Request handlers
│   ├── db/              # Database connection and migrations
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── validators/      # Input validation schemas
│   └── server.ts        # Express app entry point
├── .env.example         # Environment variables template
├── package.json
└── tsconfig.json
```

## Environment Variables

See `.env.example` for all required environment variables.

## Development

```bash
# Development with hot reload
npm run dev

# Build
npm run build

# Start production
npm start
```

## Testing

```bash
npm test
```

## License

ISC
