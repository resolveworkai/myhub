# Setup Guide

**Last Updated:** January 25, 2026

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager
- Git (for cloning repository)

## Step 1: Clone Repository

```bash
git clone <repository-url>
cd portal
```

## Step 2: Install Dependencies

```bash
cd backend
npm install
```

## Step 3: Database Setup

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE portal_db;

# Exit psql
\q
```

### Run Migrations

```bash
# Option 1: Using migration script
npm run migrate

# Option 2: Manual SQL execution
psql -U postgres -d portal_db -f src/db/migrations/001_initial_schema.sql
```

## Step 4: Environment Configuration

### Copy Environment Template

```bash
cp .env.example .env
```

### Configure Environment Variables

Edit `.env` file with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portal_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@portal.com
EMAIL_FROM_NAME=Portal
```

### Generate JWT Secrets

```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## Step 6: Verify Installation

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T10:00:00.000Z",
  "uptime": 0
}
```

### Readiness Check

```bash
curl http://localhost:3001/ready
```

Expected response:
```json
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-01-25T10:00:00.000Z"
}
```

## Step 7: Frontend Configuration

### Update Frontend API URL

In frontend `.env` or `vite.config.ts`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Troubleshooting

### Database Connection Failed

1. Verify PostgreSQL is running:
   ```bash
   psql -U postgres -c "SELECT version();"
   ```

2. Check database credentials in `.env`

3. Verify database exists:
   ```bash
   psql -U postgres -l | grep portal_db
   ```

### Port Already in Use

Change port in `.env`:
```env
PORT=3002
```

### Email Service Not Working

1. For Gmail, use App Password:
   - Enable 2FA
   - Generate App Password
   - Use App Password in `EMAIL_PASSWORD`

2. Test SMTP connection:
   ```bash
   # Add test script in package.json
   npm run test:email
   ```

### Migration Errors

1. Check PostgreSQL version (14+ required)

2. Verify database user has CREATE privileges:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE portal_db TO postgres;
   ```

3. Drop and recreate database if needed:
   ```sql
   DROP DATABASE portal_db;
   CREATE DATABASE portal_db;
   ```

## Production Deployment

### Build

```bash
npm run build
```

### Environment Variables

Set production environment variables:
- Use strong JWT secrets
- Enable SSL for database (`DB_SSL=true`)
- Configure production email service
- Set `NODE_ENV=production`

### Process Manager

Use PM2 or similar:

```bash
npm install -g pm2
pm2 start dist/server.js --name portal-backend
pm2 save
pm2 startup
```

### Reverse Proxy

Configure Nginx or similar:

```nginx
server {
    listen 80;
    server_name api.portal.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Next Steps

- Review [API Documentation](../api/api-documentation.md)
- Check [Security Documentation](../security/authentication.md)
- Set up monitoring and logging
- Configure backup strategy
