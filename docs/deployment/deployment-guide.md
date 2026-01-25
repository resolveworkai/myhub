# Deployment Guide

**Last Updated:** January 2026

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Production Configuration](#production-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements

- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **Nginx**: Latest stable (for reverse proxy)
- **PM2**: For process management (optional but recommended)
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

### System Resources

- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 20GB+ SSD
- **Network**: Stable internet connection

---

## Environment Setup

### 1. Install Node.js

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### 3. Install Nginx

```bash
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Install PM2 (Optional)

```bash
sudo npm install -g pm2
```

---

## Database Setup

### 1. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE portal_db;

# Create user
CREATE USER portal_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE portal_db TO portal_user;

# Exit
\q
```

### 2. Configure PostgreSQL

Edit `/etc/postgresql/14/main/postgresql.conf`:

```conf
# Connection settings
listen_addresses = 'localhost'
port = 5432

# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'all'
log_connections = on
log_disconnections = on
```

Edit `/etc/postgresql/14/main/pg_hba.conf`:

```conf
# Allow local connections
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 3. Run Migrations

```bash
cd backend
npm install
npm run migrate:up
```

### 4. Seed Database (Optional)

```bash
# Seed all data
npm run seed

# Or seed specific data
npm run seed:users
npm run seed:business
npm run seed:venues
```

---

## Backend Deployment

### 1. Clone Repository

```bash
cd /var/www
sudo git clone <repository-url> portal
sudo chown -R $USER:$USER portal
cd portal/backend
```

### 2. Install Dependencies

```bash
npm install --production
```

### 3. Build Application

```bash
npm run build
```

### 4. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
nano .env
```

**Production `.env` configuration:**

```env
# Server
NODE_ENV=production
PORT=3001
API_PREFIX=/api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portal_db
DB_USER=portal_user
DB_PASSWORD=your_secure_password
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_SSL=false

# JWT (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your_super_secret_jwt_key_change_in_production_use_openssl_rand_hex_64
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=30d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production_use_openssl_rand_hex_64

# Bcrypt
BCRYPT_ROUNDS=12

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
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
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true
ACCOUNT_LOCKOUT_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MINUTES=15

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
```

**Generate secure JWT secrets:**

```bash
openssl rand -hex 64  # For JWT_SECRET
openssl rand -hex 64  # For JWT_REFRESH_SECRET
```

### 5. Start with PM2

```bash
# Start application
pm2 start dist/server.js --name portal-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 6. Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/portal-backend`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/portal-backend-access.log;
    error_log /var/log/nginx/portal-backend-error.log;

    # Proxy Settings
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/portal-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## Frontend Deployment

### 1. Build Frontend

```bash
cd /var/www/portal
npm install
npm run build
```

### 2. Configure Nginx for Frontend

Create `/etc/nginx/sites-available/portal-frontend`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory
    root /var/www/portal/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/portal-frontend-access.log;
    error_log /var/log/nginx/portal-frontend-error.log;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api {
        proxy_pass https://api.yourdomain.com;
        proxy_http_version 1.1;
        proxy_set_header Host api.yourdomain.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/portal-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Setup Frontend Environment

Create `.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Portal
```

Rebuild with production environment:

```bash
npm run build
```

---

## Production Configuration

### 1. Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### 2. Database Backup

Create backup script `/usr/local/bin/backup-portal-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/portal"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U portal_user portal_db | gzip > $BACKUP_DIR/portal_db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "portal_db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: portal_db_$DATE.sql.gz"
```

Make executable:

```bash
sudo chmod +x /usr/local/bin/backup-portal-db.sh
```

Add to crontab (daily at 2 AM):

```bash
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-portal-db.sh
```

### 3. Log Rotation

Create `/etc/logrotate.d/portal`:

```
/var/www/portal/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reload portal-backend
    endscript
}
```

### 4. PM2 Monitoring

```bash
# Monitor application
pm2 monit

# View logs
pm2 logs portal-backend

# View status
pm2 status

# Restart application
pm2 restart portal-backend

# Stop application
pm2 stop portal-backend
```

---

## Monitoring & Logging

### 1. Application Logs

- **Location**: `/var/www/portal/backend/logs/`
- **Files**: `app.log`, `error.log`
- **Rotation**: Daily, keep 14 days

### 2. Nginx Logs

- **Access**: `/var/log/nginx/portal-*-access.log`
- **Error**: `/var/log/nginx/portal-*-error.log`

### 3. Database Logs

- **Location**: `/var/log/postgresql/`
- **Configuration**: `/etc/postgresql/14/main/postgresql.conf`

### 4. System Monitoring

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Network
netstat -tulpn

# Process monitoring
pm2 monit
```

---

## Troubleshooting

### Backend Not Starting

1. **Check PM2 logs:**
   ```bash
   pm2 logs portal-backend
   ```

2. **Check environment variables:**
   ```bash
   cd /var/www/portal/backend
   cat .env
   ```

3. **Check database connection:**
   ```bash
   psql -U portal_user -d portal_db -c "SELECT 1;"
   ```

4. **Check port availability:**
   ```bash
   sudo netstat -tulpn | grep 3001
   ```

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Check connection settings:**
   ```bash
   psql -U portal_user -d portal_db
   ```

3. **Check firewall:**
   ```bash
   sudo ufw status
   ```

### Nginx Issues

1. **Test configuration:**
   ```bash
   sudo nginx -t
   ```

2. **Check error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

### SSL Certificate Issues

1. **Check certificate expiry:**
   ```bash
   sudo certbot certificates
   ```

2. **Renew certificate:**
   ```bash
   sudo certbot renew
   ```

3. **Test auto-renewal:**
   ```bash
   sudo certbot renew --dry-run
   ```

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated secure JWT secrets
- [ ] Configured HTTPS with valid SSL certificate
- [ ] Set up firewall rules
- [ ] Disabled root login (SSH)
- [ ] Configured database backups
- [ ] Set up log rotation
- [ ] Configured rate limiting
- [ ] Enabled security headers
- [ ] Restricted database access
- [ ] Set up monitoring and alerts
- [ ] Regular security updates

---

## Post-Deployment

1. **Test all endpoints:**
   - Health check: `https://api.yourdomain.com/health`
   - API endpoints: Test with Postman/curl

2. **Monitor logs:**
   ```bash
   pm2 logs portal-backend
   tail -f /var/log/nginx/portal-backend-access.log
   ```

3. **Set up monitoring:**
   - Use PM2 monitoring
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure error alerts

4. **Performance tuning:**
   - Adjust database connection pool
   - Configure Nginx caching
   - Optimize database queries

---

**For more information, see:**
- [Backend README](../../backend/README.md)
- [API Documentation](../api/complete-api-reference.md)
- [Security Documentation](../security/security-measures.md)
