import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'portal_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Load mock data
const loadMockData = (filename: string) => {
  // Try backend path first, then root path
  const backendPath = path.join(__dirname, '../../src/data/mock', filename);
  const rootPath = path.join(__dirname, '../../../src/data/mock', filename);
  
  if (fs.existsSync(backendPath)) {
    return JSON.parse(fs.readFileSync(backendPath, 'utf-8'));
  } else if (fs.existsSync(rootPath)) {
    return JSON.parse(fs.readFileSync(rootPath, 'utf-8'));
  } else {
    throw new Error(`Mock data file not found: ${filename}`);
  }
};

const users = loadMockData('users.json');
const businessUsers = loadMockData('businessUsers.json');
const gyms = loadMockData('gyms.json');
const coaching = loadMockData('coaching.json');
const libraries = loadMockData('libraries.json');
const bookings = loadMockData('bookings.json');
const reviews = loadMockData('reviews.json');
const notifications = loadMockData('notifications.json');

// Hash password helper (using bcrypt)
import bcrypt from 'bcrypt';
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Seed users
async function seedUsers() {
  console.log('Seeding users...');
  const defaultPassword = await hashPassword('Password123!');
  
  for (const user of users) {
    await pool.query(
      `INSERT INTO users (
        id, email, name, phone, avatar, location_lat, location_lng, location_address,
        preferences_categories, preferences_price_range, email_verified, phone_verified,
        marketing_consent, account_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        avatar = EXCLUDED.avatar,
        location_lat = EXCLUDED.location_lat,
        location_lng = EXCLUDED.location_lng,
        location_address = EXCLUDED.location_address,
        preferences_categories = EXCLUDED.preferences_categories,
        preferences_price_range = EXCLUDED.preferences_price_range`,
      [
        user.id,
        user.email,
        user.name,
        user.phone,
        user.avatar,
        user.location.lat,
        user.location.lng,
        user.location.address,
        user.preferences.categories,
        user.preferences.priceRange,
        true, // email_verified
        true, // phone_verified
        user.preferences.marketingConsent || false,
        'active',
        user.joinDate || new Date().toISOString(),
      ]
    );
    
    // Set password for test users
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [defaultPassword, user.id]
    );
  }
  
  console.log(`✓ Seeded ${users.length} users`);
}

// Seed business users
async function seedBusinessUsers() {
  console.log('Seeding business users...');
  const defaultPassword = await hashPassword('Password123!');
  
  for (const business of businessUsers) {
    await pool.query(
      `INSERT INTO business_users (
        id, email, business_name, owner_name, phone, business_type, registration_number,
        years_in_operation, subscription_tier, email_verified, phone_verified,
        business_verified, verification_status, account_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        business_name = EXCLUDED.business_name,
        owner_name = EXCLUDED.owner_name,
        phone = EXCLUDED.phone`,
      [
        business.id,
        business.email,
        business.businessName,
        business.ownerName,
        business.phone,
        business.businessType,
        business.registrationNumber,
        business.yearsInOperation || '1-2 years',
        business.subscriptionTier,
        business.verified,
        true,
        business.verified,
        business.verified ? 'verified' : 'pending',
        business.verified ? 'active' : 'pending_verification',
        business.joinDate || new Date().toISOString(),
      ]
    );
    
    // Set password
    await pool.query(
      'UPDATE business_users SET password_hash = $1 WHERE id = $2',
      [defaultPassword, business.id]
    );
  }
  
  console.log(`✓ Seeded ${businessUsers.length} business users`);
}

// Seed venues
async function seedVenues() {
  console.log('Seeding venues...');
  
  // Create a mapping from business user to venue
  const businessVenueMap: Record<string, string[]> = {};
  businessUsers.forEach((bu: any) => {
    businessVenueMap[bu.id] = bu.locations || [];
  });
  
  const allVenues = [
    ...gyms.map((g: any) => ({ ...g, category: 'gym' })),
    ...coaching.map((c: any) => ({ ...c, category: 'coaching' })),
    ...libraries.map((l: any) => ({ ...l, category: 'library' })),
  ];
  
  for (const venue of allVenues) {
    // Find business user that owns this venue
    let businessUserId = null;
    for (const [buId, venueIds] of Object.entries(businessVenueMap)) {
      if (venueIds.includes(venue.id)) {
        businessUserId = buId;
        break;
      }
    }
    
    // If no business user found, assign to first business user of same type
    if (!businessUserId) {
      const matchingBusiness = businessUsers.find(
        (bu: any) => bu.businessType === venue.category
      );
      businessUserId = matchingBusiness?.id || businessUsers[0].id;
    }
    
    const attributes: any = {};
    if (venue.subjects) attributes.subjects = venue.subjects;
    if (venue.equipment) attributes.equipment = venue.equipment;
    if (venue.facilities) attributes.facilities = venue.facilities;
    
    await pool.query(
      `INSERT INTO venues (
        id, business_user_id, name, category, description, image, rating, reviews_count,
        price, price_label, location_lat, location_lng, location_address, location_city,
        amenities, status, occupancy, capacity, verified, open_now, attributes, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        price = EXCLUDED.price,
        occupancy = EXCLUDED.occupancy,
        capacity = EXCLUDED.capacity,
        status = EXCLUDED.status,
        open_now = EXCLUDED.open_now`,
      [
        venue.id,
        businessUserId,
        venue.name,
        venue.category,
        venue.description,
        venue.image,
        venue.rating,
        venue.reviews,
        venue.price,
        venue.priceLabel,
        venue.location.lat,
        venue.location.lng,
        venue.location.address,
        venue.location.city,
        venue.amenities || [],
        venue.status,
        venue.occupancy,
        venue.capacity,
        venue.verified,
        venue.openNow,
        JSON.stringify(attributes),
        true, // is_published
      ]
    );
  }
  
  console.log(`✓ Seeded ${allVenues.length} venues`);
}

// Seed bookings
async function seedBookings() {
  console.log('Seeding bookings...');
  
  for (const booking of bookings) {
    await pool.query(
      `INSERT INTO bookings (
        id, user_id, venue_id, venue_type, booking_date, booking_time, duration,
        status, total_price, attendees, special_requests, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        total_price = EXCLUDED.total_price`,
      [
        booking.id,
        booking.userId,
        booking.venueId,
        booking.venueType,
        booking.date,
        booking.time,
        booking.duration,
        booking.status,
        booking.totalPrice,
        booking.attendees,
        booking.specialRequests || null,
        booking.bookingDate || new Date().toISOString(),
      ]
    );
  }
  
  console.log(`✓ Seeded ${bookings.length} bookings`);
}

// Seed reviews
async function seedReviews() {
  console.log('Seeding reviews...');
  
  for (const review of reviews) {
    await pool.query(
      `INSERT INTO reviews (
        id, user_id, venue_id, rating, comment, helpful_count, business_reply, business_reply_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        helpful_count = EXCLUDED.helpful_count`,
      [
        review.id,
        review.userId,
        review.venueId,
        review.rating,
        review.comment,
        review.helpful,
        review.response?.businessReply || null,
        review.response?.date || null,
        review.date || new Date().toISOString(),
      ]
    );
  }
  
  console.log(`✓ Seeded ${reviews.length} reviews`);
}

// Seed favorites
async function seedFavorites() {
  console.log('Seeding favorites...');
  
  for (const user of users) {
    for (const venueId of user.favorites || []) {
      await pool.query(
        `INSERT INTO favorites (user_id, venue_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, venue_id) DO NOTHING`,
        [user.id, venueId]
      );
    }
  }
  
  const totalFavorites = users.reduce((sum: number, u: any) => sum + (u.favorites?.length || 0), 0);
  console.log(`✓ Seeded ${totalFavorites} favorites`);
}

// Seed notifications
async function seedNotifications() {
  console.log('Seeding notifications...');
  
  for (const notification of notifications) {
    await pool.query(
      `INSERT INTO notifications (
        id, user_id, user_type, type, title, message, related_entity, action_url,
        action_label, priority, read, delivery_channels, delivery_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        read = EXCLUDED.read`,
      [
        notification.id,
        notification.userId,
        notification.userType,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.relatedEntity),
        notification.actionUrl,
        notification.actionLabel,
        notification.priority,
        notification.read,
        notification.deliveryChannels,
        JSON.stringify(notification.deliveryStatus),
        notification.createdAt,
      ]
    );
  }
  
  console.log(`✓ Seeded ${notifications.length} notifications`);
}

// Main seed function
async function seed() {
  const args = process.argv.slice(2);
  const seedType = args[0];
  
  try {
    console.log('Starting database seeding...\n');
    
    if (!seedType || seedType === 'all') {
      await seedUsers();
      await seedBusinessUsers();
      await seedVenues();
      await seedBookings();
      await seedReviews();
      await seedFavorites();
      await seedNotifications();
    } else if (seedType === 'users') {
      await seedUsers();
    } else if (seedType === 'business') {
      await seedBusinessUsers();
    } else if (seedType === 'venues') {
      await seedVenues();
    } else if (seedType === 'bookings') {
      await seedBookings();
    } else if (seedType === 'reviews') {
      await seedReviews();
    } else if (seedType === 'favorites') {
      await seedFavorites();
    } else if (seedType === 'notifications') {
      await seedNotifications();
    } else {
      console.error(`Unknown seed type: ${seedType}`);
      process.exit(1);
    }
    
    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('  Member: test@member.com / Password123!');
    console.log('  Business: test@business.com / Password123!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seed
seed();
