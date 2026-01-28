# Portal Backend Documentation

**Last Updated:** January 2026

## Table of Contents

1. [API Documentation](./api/complete-api-reference.md)
2. [Database Documentation](./database/complete-schema.md)
3. [Database ERD](./database/erd-diagram.md)
4. [Architecture Documentation](./architecture/backend-architecture.md)
5. [Configuration Documentation](./configuration/environment-variables.md)
6. [Security Documentation](./security/security-measures.md)
7. [Deployment Guide](./deployment/deployment-guide.md)
8. [Frontend Analysis](./analysis/frontend-analysis-report.md)

## Quick Links

- [Complete API Reference](./api/complete-api-reference.md)
- [Database Schema](./database/complete-schema.md)
- [ERD Diagram](./database/erd-diagram.md)
- [Deployment Guide](./deployment/deployment-guide.md)
- [Security Measures](./security/security-measures.md)
- [Backend Architecture](./architecture/backend-architecture.md)

## Recent Updates (Latest)

### Bug Fixes - January 2025

1. **Venue API Distance Column Error**
   - Fixed SQL COUNT query error when filtering venues by radius
   - Implemented proper subquery structure for distance calculations
   - Resolved parameter indexing issues in complex queries

2. **Business Members Phone Constraint**
   - Made phone field optional for business-created members
   - Added placeholder email generation for guest users
   - Enabled flexible member management without strict user table relationship

3. **Business Dashboard Notifications**
   - Integrated NotificationDropdown component
   - Fixed notification fetching for business users
   - Properly mapped account types to user types

4. **Appointments Management**
   - Added API endpoint for creating business appointments (`POST /api/bookings/business`)
   - Fixed bookings undefined error in frontend
   - Removed incorrect `deleted_at` column reference from bookings table
   - Implemented proper venue ID resolution for appointments

5. **Business Settings Save Functionality**
   - Fixed all save buttons to immediately reflect changes in UI
   - Added proper state updates after successful API calls
   - Ensured data persistence and UI synchronization

6. **Payments Authentication**
   - Added authentication middleware to payment routes
   - Fixed 401 unauthorized errors when accessing payment endpoints
   - Ensured proper business account verification

7. **TypeScript Type Safety**
   - Replaced critical `any` types with proper interfaces
   - Added type definitions for booking, venue, and business services
   - Improved type safety across the application

8. **Export Functionality**
   - Added Excel/CSV export for business members list
   - Implemented proper data formatting and download functionality

## Recent Updates (Previous) (January 2026)

- ✅ Complete backend implementation with all API endpoints
- ✅ Frontend API integration - all mock data replaced with real API calls
- ✅ Comprehensive documentation (API, database, architecture, security)
- ✅ ERD diagram with Mermaid
- ✅ Complete deployment guide
- ✅ Production-ready configuration
- ✅ **Bug Fixes (January 26, 2026):**
  - Fixed venue API validation to accept numeric price ranges (e.g., "0,50000") in addition to symbolic ranges ($, $$, $$$)
  - Fixed venue API to accept "all" status filter
  - Fixed SQL distance column error in venue listing with location filters
  - Fixed login redirect issue - added `account_type` field to user response for proper role-based routing
  - Fixed business dashboard stats SQL error (p.status → p.payment_status)
- ✅ **Business Settings Implementation (January 26, 2026):**
  - Complete business settings flow with 7 sections: Business Information, Location & Media, Business Attributes, Membership Packages, Operating Hours, Notification Preferences, Security Settings
  - Database migration for settings columns (operating_hours, logo, cover_image, gallery_images, notification_preferences, security_settings, business_attributes, description)
  - Backend API endpoints for all settings sections
  - Frontend integration with backend APIs
  - Full CRUD operations for business settings

## Overview

This backend provides a production-ready API for the Portal application, supporting both member and business user authentication, venue management, bookings, reviews, and notifications.

### Key Features

- ✅ Member and Business signup flows
- ✅ Email verification with OTP
- ✅ JWT-based authentication
- ✅ Venue listing with advanced filtering
- ✅ Booking management
- ✅ Review system with business replies
- ✅ Favorites management
- ✅ Notification system
- ✅ Business analytics
- ✅ Rate limiting and security measures
- ✅ Comprehensive error handling
- ✅ Audit logging
- ✅ Database transactions
- ✅ Connection pooling

## Getting Started

See [Deployment Guide](./deployment/deployment-guide.md) for installation and configuration instructions.

## API Base URL

- Development: `http://localhost:3001/api`
- Production: `https://api.yourdomain.com/api`

## Documentation Structure

### API Documentation
- [Complete API Reference](./api/complete-api-reference.md) - All endpoints with examples

### Database Documentation
- [Complete Schema](./database/complete-schema.md) - All tables, columns, relationships
- [ERD Diagram](./database/erd-diagram.md) - Visual entity relationship diagram

### Architecture Documentation
- [Backend Architecture](./architecture/backend-architecture.md) - System design and layers
- [Folder Structure](./architecture/folder-structure.md) - Code organization

### Security Documentation
- [Security Measures](./security/security-measures.md) - Authentication, authorization, best practices

### Deployment Documentation
- [Deployment Guide](./deployment/deployment-guide.md) - Production deployment steps
- [Environment Variables](./configuration/environment-variables.md) - Configuration reference

## Support

For issues or questions, please refer to the relevant documentation section or contact the development team.

---

**All phases completed! The backend is production-ready and fully integrated with the frontend.**
