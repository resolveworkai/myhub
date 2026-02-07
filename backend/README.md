# Portal Backend API

Enterprise-grade Node.js + TypeScript + PostgreSQL backend for the Portal platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portal_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_SSL=false

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=30d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production

# Bcrypt
BCRYPT_ROUNDS=12

# Email (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@portal.com
EMAIL_FROM_NAME=Portal

# OTP
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=15
OTP_MAX_ATTEMPTS=3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX_REQUESTS=5

# Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_CREDENTIALS=true
ACCOUNT_LOCKOUT_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MINUTES=15

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
```

### Database Setup

```bash
# Run migrations
npm run migrate:up

# Seed database with test data
npm run seed
```

### Development

```bash
# Start development server
npm run dev

# Server runs on http://localhost:3001
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Request handlers
│   ├── db/              # Database pool & migrations
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utilities (errors, logger)
│   ├── validators/      # Input validation schemas
│   └── server.ts        # Express app
├── scripts/
│   └── seed-mock-data.ts # Database seeding
└── logs/                # Application logs
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/member/signup` - Member registration
- `POST /api/auth/business/signup` - Business registration
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email OTP
- `POST /api/auth/resend-otp` - Resend OTP

### Venues
- `GET /api/venues` - List venues (with filters)
- `GET /api/venues/:id` - Get venue details
- `GET /api/venues/:id/schedule` - Get schedule
- `GET /api/venues/:id/reviews` - Get reviews
- `GET /api/venues/:id/availability` - Check availability

### Bookings
- `GET /api/bookings` - List user bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Reviews
- `POST /api/reviews` - Create review
- `PATCH /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/reply` - Business reply

### User
- `GET /api/users/me` - Get profile
- `PATCH /api/users/me` - Update profile
- `GET /api/users/me/favorites` - Get favorites
- `POST /api/users/me/favorites/:venueId` - Add favorite
- `DELETE /api/users/me/favorites/:venueId` - Remove favorite
- `GET /api/users/me/payments` - Payment history
- `POST /api/users/me/change-password` - Change password

### Business
- `GET /api/business/me` - Get profile
- `PATCH /api/business/me` - Update profile
- `GET /api/business/members` - List members (supports status filter: active, overdue, expired, cancelled)
- `POST /api/business/members` - Add member
- `GET /api/business/analytics` - Get analytics
- `POST /api/business/announcements` - Send announcement

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🗄️ Database

### Migrations

```bash
# Run migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create migration_name
```

### Seeding

```bash
# Seed all data
npm run seed

# Seed specific data
npm run seed:users
npm run seed:business
npm run seed:venues
```

**Test Credentials:**
- Member: `test@member.com` / `Password123!`
- Business: `test@business.com` / `Password123!`

## 🔒 Security Features

- ✅ JWT authentication (access + refresh tokens)
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Rate limiting on all endpoints
- ✅ Account lockout after failed attempts
- ✅ Input validation with Joi
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Request sanitization

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate:up` - Run migrations
- `npm run migrate:down` - Rollback migrations
- `npm run seed` - Seed database
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 📚 Documentation

- [Complete API Reference](../docs/api/complete-api-reference.md)
- [Frontend Analysis](../docs/analysis/frontend-analysis-report.md)
- [Database Schema](../docs/database/schema.md)
- [Implementation Status](./IMPLEMENTATION_STATUS.md)

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `.env` database credentials
- Ensure database exists

### Migration Errors
- Check database user has CREATE privileges
- Verify migration files are in correct order

### Seed Script Errors
- Ensure mock data files exist in `src/data/mock/`
- Check database tables are created (run migrations first)

## 📄 License

ISC

---

**For detailed API documentation, see [Complete API Reference](../docs/api/complete-api-reference.md)**
