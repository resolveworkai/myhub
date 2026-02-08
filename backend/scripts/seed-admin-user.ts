import { pool } from '../src/db/pool';
import bcrypt from 'bcrypt';
import { config } from '../src/config';

/**
 * Seed script to create a default admin user
 * Usage: npx tsx scripts/seed-admin-user.ts
 */

const DEFAULT_ADMIN = {
  email: 'admin@myhub.com',
  password: 'Admin@123', // Change this in production!
  name: 'Super Admin',
  role: 'super_admin' as const,
};

async function seedAdminUser() {
  try {
    console.log('🌱 Seeding admin user...');

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT id FROM admin_users WHERE email = $1 AND deleted_at IS NULL',
      [DEFAULT_ADMIN.email.toLowerCase()]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists. Skipping...');
      console.log(`   Email: ${DEFAULT_ADMIN.email}`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, config.bcrypt.rounds);

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role, account_status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id, email, name, role`,
      [
        DEFAULT_ADMIN.email.toLowerCase(),
        passwordHash,
        DEFAULT_ADMIN.name,
        DEFAULT_ADMIN.role,
      ]
    );

    const admin = result.rows[0];

    console.log('✅ Admin user created successfully!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedAdminUser()
    .then(() => {
      console.log('\n✨ Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedAdminUser };
