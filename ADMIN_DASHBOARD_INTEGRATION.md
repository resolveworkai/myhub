# Admin Dashboard Integration Documentation

**Version:** 1.0.0  
**Date:** February 2026  
**Status:** ✅ Complete

## Overview

This document describes the complete integration of the admin dashboard frontend with backend APIs. The admin dashboard provides comprehensive platform management capabilities including user management, business management, analytics, and system configuration.

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration](#frontend-integration)
6. [Setup & Configuration](#setup--configuration)
7. [Usage Guide](#usage-guide)

---

## Architecture

### Backend Structure

```
backend/src/
├── controllers/
│   └── adminController.ts      # Admin API controllers
├── services/
│   └── adminService.ts         # Business logic for admin operations
├── routes/
│   └── adminRoutes.ts          # Admin API routes
├── middleware/
│   └── auth.ts                 # Updated with requireAdmin middleware
├── validators/
│   └── adminValidators.ts      # Input validation schemas
└── db/migrations/
    └── 010_admin_users_schema.sql  # Admin users table
```

### Frontend Structure

```
src/
├── pages/
│   └── AdminDashboard.tsx      # Main admin dashboard component
├── lib/
│   └── adminApiService.ts      # Admin API service functions
└── components/
    └── auth/
        └── ProtectedRoute.tsx  # Updated with admin support
```

---

## Database Schema

### Admin Users Table

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### Pass Configurations Table

```sql
CREATE TABLE pass_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  pass_type VARCHAR(50) NOT NULL CHECK (pass_type IN ('daily', 'weekly', 'monthly', 'custom')),
  duration_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### Platform Settings Table

```sql
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Authentication & Authorization

### Admin Login Flow

1. **Login Request**: Admin logs in using email and password via `/api/admin/auth/login`
2. **Database Check**: System checks `admin_users` table (along with `users` and `business_users`)
3. **Token Generation**: JWT tokens generated with `accountType: 'admin'`
4. **Frontend Redirect**: Frontend detects `accountType === 'admin'` and redirects to `/admin`

### Authentication Middleware

The `requireAdmin` middleware:
- Verifies JWT token
- Checks if `accountType === 'admin'`
- Validates admin user exists and is active in database
- Returns 403 if not admin

### Account Type Detection

The login endpoint checks all three tables in order:
1. `users` table (normal users)
2. `business_users` table (business accounts)
3. `admin_users` table (admin accounts)

The first match determines the account type.

---

## API Endpoints

### Authentication

#### POST `/api/admin/auth/login`
Admin login endpoint.

**Request:**
```json
{
  "email": "admin@myhub.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "uuid",
      "email": "admin@myhub.com",
      "name": "Super Admin",
      "role": "super_admin"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### Dashboard

#### GET `/api/admin/dashboard/stats`
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBusinesses": 150,
    "totalUsers": 5000,
    "totalVenues": 200,
    "totalBookings": 10000,
    "pendingBusinesses": 5,
    "activeUsers": 4500,
    "recentBusinesses": [...],
    "recentUsers": [...]
  }
}
```

### Business Management

#### GET `/api/admin/businesses`
List all businesses with filters.

**Query Parameters:**
- `search` - Search by name/email
- `businessType` - Filter by type (gym, coaching, library)
- `verificationStatus` - Filter by status (pending, verified, rejected)
- `accountStatus` - Filter by account status
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

#### POST `/api/admin/businesses/:id/verify`
Verify a business account.

#### POST `/api/admin/businesses/:id/suspend`
Suspend or activate a business.

**Request:**
```json
{
  "suspend": true
}
```

#### DELETE `/api/admin/businesses/:id`
Delete a business (soft delete).

### User Management

#### GET `/api/admin/users`
List all users with filters.

**Query Parameters:**
- `search` - Search by name/email
- `accountStatus` - Filter by status
- `page` - Page number
- `limit` - Items per page

#### GET `/api/admin/users/:id`
Get user details.

#### POST `/api/admin/users/:id/suspend`
Suspend or activate a user.

**Request:**
```json
{
  "suspend": true
}
```

### Pass Configuration

#### GET `/api/admin/passes`
Get all pass configurations.

#### POST `/api/admin/passes`
Create a new pass configuration.

**Request:**
```json
{
  "name": "Monthly Premium",
  "description": "Premium monthly pass",
  "passType": "monthly",
  "durationDays": 30,
  "price": 4999
}
```

#### PATCH `/api/admin/passes/:id`
Update a pass configuration.

#### DELETE `/api/admin/passes/:id`
Delete a pass configuration.

### Analytics

#### GET `/api/admin/analytics`
Get analytics data.

**Query Parameters:**
- `period` - Time period (week, month, year)

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingsByType": [
      { "type": "gym", "count": 500 },
      { "type": "library", "count": 300 },
      { "type": "coaching", "count": 200 }
    ],
    "venueDistribution": [...],
    "revenueByType": [...]
  }
}
```

### Platform Settings

#### GET `/api/admin/settings`
Get all platform settings.

#### PATCH `/api/admin/settings/:key`
Update a platform setting.

**Request:**
```json
{
  "value": true,
  "description": "Enable maintenance mode"
}
```

---

## Frontend Integration

### Admin API Service

All admin API calls are handled through `src/lib/adminApiService.ts`:

```typescript
import {
  getDashboardStats,
  getBusinesses,
  verifyBusiness,
  suspendBusiness,
  // ... other functions
} from '@/lib/adminApiService';
```

### Protected Routes

Admin routes are protected using `ProtectedRoute` component:

```tsx
<Route path="/admin/*" element={
  <ProtectedRoute requiredAccountType="admin">
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### Login Redirect

When an admin user logs in, the frontend automatically redirects to `/admin`:

```typescript
if (result.user.accountType === 'admin') {
  navigate('/admin');
}
```

---

## Setup & Configuration

### 1. Run Database Migration

```bash
cd backend
npm run migrate:up
```

This will create the `admin_users`, `pass_configurations`, and `platform_settings` tables.

### 2. Create Admin User

Run the seed script to create a default admin user:

```bash
cd backend
npm run seed:admin
```

**Default Admin Credentials:**
- Email: `admin@myhub.com`
- Password: `Admin@123`

⚠️ **IMPORTANT**: Change the default password after first login!

### 3. Environment Variables

Ensure these environment variables are set:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Bcrypt
BCRYPT_ROUNDS=12
```

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

### 5. Start Frontend

```bash
npm run dev
```

---

## Usage Guide

### Admin Login

1. Navigate to `/signin` or `/login`
2. Enter admin email and password
3. System automatically detects admin account type
4. Redirects to `/admin` dashboard

### Managing Businesses

1. Navigate to **Businesses** in admin sidebar
2. Use search and filters to find businesses
3. Click **Verify** to approve pending businesses
4. Click **Suspend** to suspend/activate businesses
5. Click **Delete** to remove businesses (soft delete)

### Managing Users

1. Navigate to **Users** in admin sidebar
2. Use search to find users
3. Click **View** to see user details
4. Click **Suspend** to suspend/activate users

### Viewing Analytics

1. Navigate to **Analytics** in admin sidebar
2. View real-time statistics and charts
3. Filter by time period (week, month, year)
4. Export reports (coming soon)

### Configuring Pass Types

1. Navigate to **Pass Management** in admin sidebar
2. Click **Create New Pass** to add a new pass type
3. Edit existing passes
4. Activate/deactivate passes

### Platform Settings

1. Navigate to **Settings** in admin sidebar
2. Toggle platform-wide settings:
   - Maintenance Mode
   - Email Notifications
   - Auto-Verification
   - Rate Limiting

---

## Security Features

### Authentication
- JWT-based authentication
- Bcrypt password hashing (12 rounds)
- Account lockout after failed attempts
- Session management

### Authorization
- Role-based access control (admin/super_admin)
- Protected API endpoints
- Frontend route guards

### Audit Logging
- All admin actions are logged to `audit_logs` table
- Includes: user_id, action, resource_type, resource_id, metadata

### Input Validation
- Joi schema validation for all inputs
- SQL injection prevention (parameterized queries)
- XSS protection

---

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Admin access required
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed

---

## Testing

### Manual Testing

1. **Admin Login**:
   ```bash
   # Use default credentials
   Email: admin@myhub.com
   Password: Admin@123
   ```

2. **Test Business Management**:
   - List businesses
   - Verify a business
   - Suspend a business
   - Delete a business

3. **Test User Management**:
   - List users
   - View user details
   - Suspend a user

### API Testing

Use tools like Postman or curl:

```bash
# Login
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myhub.com","password":"Admin@123"}'

# Get dashboard stats (with token)
curl -X GET http://localhost:3001/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Admin Login Not Working

1. Check if admin user exists:
   ```sql
   SELECT * FROM admin_users WHERE email = 'admin@myhub.com';
   ```

2. Verify password hash is correct
3. Check account status is 'active'
4. Check if account is locked

### Redirect Not Working

1. Verify `accountType` is set to 'admin' in auth store
2. Check ProtectedRoute is configured correctly
3. Verify token includes admin account type

### API Errors

1. Check backend logs in `backend/logs/`
2. Verify database connection
3. Check environment variables
4. Verify JWT secret is set

---

## Future Enhancements

- [ ] Admin user management (CRUD operations)
- [ ] Role-based permissions (admin vs super_admin)
- [ ] Data export (CSV/Excel)
- [ ] Advanced analytics with date ranges
- [ ] Real-time notifications
- [ ] Audit log viewer
- [ ] Bulk operations
- [ ] Advanced search and filtering

---

## Support

For issues or questions:
1. Check backend logs: `backend/logs/app.log`
2. Review API documentation
3. Check database for data integrity
4. Verify environment configuration

---

**Last Updated:** February 2026  
**Maintained By:** Development Team
