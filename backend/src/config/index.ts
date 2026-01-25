import dotenv from 'dotenv';

dotenv.config();

interface Config {
  env: string;
  port: number;
  apiPrefix: string;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    poolMin: number;
    poolMax: number;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    accessExpiry: string;
    refreshExpiry: string;
    refreshSecret: string;
  };
  bcrypt: {
    rounds: number;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
    fromName: string;
  };
  otp: {
    length: number;
    expiryMinutes: number;
    maxAttempts: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    authWindowMs: number;
    authMaxRequests: number;
  };
  security: {
    allowedOrigins: string[];
    corsCredentials: boolean;
    accountLockoutAttempts: number;
    accountLockoutDurationMinutes: number;
  };
  logging: {
    level: string;
    file: string;
    maxSize: string;
    maxFiles: string;
  };
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  return value ? value === 'true' : defaultValue;
}

export const config: Config = {
  env: getEnv('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3001),
  apiPrefix: getEnv('API_PREFIX', '/api'),
  db: {
    host: getRequiredEnv('DB_HOST'),
    port: getEnvNumber('DB_PORT', 5432),
    name: getRequiredEnv('DB_NAME'),
    user: getRequiredEnv('DB_USER'),
    password: getRequiredEnv('DB_PASSWORD'),
    poolMin: getEnvNumber('DB_POOL_MIN', 2),
    poolMax: getEnvNumber('DB_POOL_MAX', 10),
    ssl: getEnvBoolean('DB_SSL', false),
  },
  jwt: {
    secret: getRequiredEnv('JWT_SECRET'),
    accessExpiry: getEnv('JWT_ACCESS_EXPIRY', '15m'),
    refreshExpiry: getEnv('JWT_REFRESH_EXPIRY', '7d'),
    refreshSecret: getRequiredEnv('JWT_REFRESH_SECRET'),
  },
  bcrypt: {
    rounds: getEnvNumber('BCRYPT_ROUNDS', 12),
  },
  email: {
    host: getRequiredEnv('EMAIL_HOST'),
    port: getEnvNumber('EMAIL_PORT', 587),
    secure: getEnvBoolean('EMAIL_SECURE', false),
    user: getRequiredEnv('EMAIL_USER'),
    password: getRequiredEnv('EMAIL_PASSWORD'),
    from: getRequiredEnv('EMAIL_FROM'),
    fromName: getRequiredEnv('EMAIL_FROM_NAME'),
  },
  otp: {
    length: getEnvNumber('OTP_LENGTH', 6),
    expiryMinutes: getEnvNumber('OTP_EXPIRY_MINUTES', 10),
    maxAttempts: getEnvNumber('OTP_MAX_ATTEMPTS', 3),
  },
  rateLimit: {
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    authWindowMs: getEnvNumber('RATE_LIMIT_AUTH_WINDOW_MS', 900000), // 15 minutes
    authMaxRequests: getEnvNumber('RATE_LIMIT_AUTH_MAX_REQUESTS', 5),
  },
  security: {
    allowedOrigins: getEnv('ALLOWED_ORIGINS', 'http://localhost:5173').split(','),
    corsCredentials: getEnvBoolean('CORS_CREDENTIALS', true),
    accountLockoutAttempts: getEnvNumber('ACCOUNT_LOCKOUT_ATTEMPTS', 5),
    accountLockoutDurationMinutes: getEnvNumber('ACCOUNT_LOCKOUT_DURATION_MINUTES', 15),
  },
  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    file: getEnv('LOG_FILE', 'logs/app.log'),
    maxSize: getEnv('LOG_MAX_SIZE', '20m'),
    maxFiles: getEnv('LOG_MAX_FILES', '14d'),
  },
};

// Validate critical config in production
if (config.env === 'production') {
  if (config.jwt.secret === 'your_super_secret_jwt_key_change_in_production') {
    throw new Error('JWT_SECRET must be changed in production');
  }
  if (config.jwt.refreshSecret === 'your_super_secret_refresh_key_change_in_production') {
    throw new Error('JWT_REFRESH_SECRET must be changed in production');
  }
}
