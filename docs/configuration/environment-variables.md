# Environment Variables Documentation

**Last Updated:** January 25, 2026

## Overview

All environment variables are loaded from `.env` file using `dotenv`. Required variables must be set or the application will fail to start.

## Variables

### Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment: development, staging, production |
| `PORT` | No | `3001` | Server port |
| `API_PREFIX` | No | `/api` | API route prefix |

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | - | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_NAME` | Yes | - | Database name |
| `DB_USER` | Yes | - | Database user |
| `DB_PASSWORD` | Yes | - | Database password |
| `DB_POOL_MIN` | No | `2` | Minimum connection pool size |
| `DB_POOL_MAX` | No | `10` | Maximum connection pool size |
| `DB_SSL` | No | `false` | Enable SSL for database connection |

### JWT Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret key for access tokens |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Access token expiration |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token expiration |
| `JWT_REFRESH_SECRET` | Yes | - | Secret key for refresh tokens |

**Security Note:** In production, `JWT_SECRET` and `JWT_REFRESH_SECRET` must be changed from defaults.

### Bcrypt Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BCRYPT_ROUNDS` | No | `12` | Bcrypt hashing rounds (12+ recommended) |

### Email Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_HOST` | Yes | - | SMTP host (e.g., smtp.gmail.com) |
| `EMAIL_PORT` | No | `587` | SMTP port |
| `EMAIL_SECURE` | No | `false` | Use TLS/SSL |
| `EMAIL_USER` | Yes | - | SMTP username |
| `EMAIL_PASSWORD` | Yes | - | SMTP password/app password |
| `EMAIL_FROM` | Yes | - | From email address |
| `EMAIL_FROM_NAME` | Yes | - | From name |

### OTP Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OTP_LENGTH` | No | `6` | OTP code length |
| `OTP_EXPIRY_MINUTES` | No | `10` | OTP expiration time in minutes |
| `OTP_MAX_ATTEMPTS` | No | `3` | Maximum verification attempts |

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |
| `RATE_LIMIT_AUTH_WINDOW_MS` | No | `900000` | Auth rate limit window |
| `RATE_LIMIT_AUTH_MAX_REQUESTS` | No | `5` | Max auth requests per window |

### Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowed origins |
| `CORS_CREDENTIALS` | No | `true` | Allow credentials in CORS |
| `ACCOUNT_LOCKOUT_ATTEMPTS` | No | `5` | Failed attempts before lockout |
| `ACCOUNT_LOCKOUT_DURATION_MINUTES` | No | `15` | Lockout duration in minutes |

### Logging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `info` | Log level: error, warn, info, debug |
| `LOG_FILE` | No | `logs/app.log` | Log file path |
| `LOG_MAX_SIZE` | No | `20m` | Max log file size |
| `LOG_MAX_FILES` | No | `14d` | Log retention period |

## Environment-Specific Values

### Development

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_NAME=portal_db_dev
LOG_LEVEL=debug
```

### Production

```env
NODE_ENV=production
PORT=3001
DB_HOST=db.production.com
DB_NAME=portal_db
DB_SSL=true
LOG_LEVEL=info
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
```

## Validation

The application validates required environment variables on startup:

- Missing required variables throw an error
- Production environment checks for default JWT secrets
- Database connection is tested on startup

## Security Considerations

1. **Never commit `.env` file** - Use `.env.example` as template
2. **Use strong secrets** - Generate random strings for JWT secrets
3. **Rotate secrets regularly** - Change JWT secrets periodically
4. **Use environment-specific values** - Different values for dev/staging/prod
5. **Limit database access** - Use least privilege principle
6. **Enable SSL in production** - Set `DB_SSL=true` in production

## Generating Secrets

```bash
# JWT Secret (32+ characters recommended)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
