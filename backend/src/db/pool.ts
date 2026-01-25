import { Pool, PoolConfig } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

const poolConfig: PoolConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  min: config.db.poolMin,
  max: config.db.poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
};

export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err });
});

// Test connection on startup
pool.query('SELECT NOW()', (err) => {
  if (err) {
    logger.error('Database connection failed', { error: err });
    process.exit(1);
  } else {
    logger.info('Database connected successfully', {
      host: config.db.host,
      database: config.db.name,
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Closing database pool...');
  await pool.end();
  process.exit(0);
});
