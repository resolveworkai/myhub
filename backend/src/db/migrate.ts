import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './pool';
import { logger } from '../utils/logger';

async function runMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Read migration file
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '001_initial_schema.sql'),
      'utf-8'
    );

    // Execute migration
    await client.query(migrationSQL);

    await client.query('COMMIT');

    logger.info('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed', { error });
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration error', { error });
      process.exit(1);
    });
}

export { runMigrations };
