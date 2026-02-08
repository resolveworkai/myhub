import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

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

// Map to convert short/mock ids (like "u1", "g1") to real UUIDs
const idMap: Record<string, string> = {};
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const resolveId = (id?: string) => {
  if (!id) return randomUUID();
  if (uuidRegex.test(id)) return id;
  if (!idMap[id]) idMap[id] = randomUUID();
  return idMap[id];
};

// Normalize all mock data ids and cross-references to real UUIDs
const normalizeMockIds = () => {
  users.forEach((u: any) => { u._id = resolveId(u.id); });
  businessUsers.forEach((b: any) => { b._id = resolveId(b.id); });
  gyms.forEach((g: any) => { g._id = resolveId(g.id); });
  coaching.forEach((c: any) => { c._id = resolveId(c.id); });
  libraries.forEach((l: any) => { l._id = resolveId(l.id); });

  // Normalize business user locations (venue ids)
  businessUsers.forEach((b: any) => {
    if (Array.isArray(b.locations)) b._locations = b.locations.map((vid: string) => resolveId(vid));
    else b._locations = [];
  });

  // Normalize user favorites/bookings
  users.forEach((u: any) => {
    u._favorites = Array.isArray(u.favorites) ? u.favorites.map((vid: string) => resolveId(vid)) : [];
    u._bookings = Array.isArray(u.bookings) ? u.bookings.map((bid: string) => resolveId(bid)) : [];
  });

  // Normalize bookings and reviews references
  bookings.forEach((b: any) => {
    if (b.id) b._id = resolveId(b.id);
    b._userId = resolveId(b.userId || b.user_id || b.user);
    b._venueId = resolveId(b.venueId || b.venue_id || b.venue);
  });

  reviews.forEach((r: any) => {
    if (r.id) r._id = resolveId(r.id);
    r._userId = resolveId(r.userId || r.user_id || r.user);
    r._venueId = resolveId(r.venueId || r.venue_id || r.venue);
  });

  // Normalize venues arrays into single list with _id
  const allVenues = [...gyms, ...coaching, ...libraries];
  allVenues.forEach((v: any) => { v._id = resolveId(v.id); });
  return allVenues;
};

const normalizedVenues = normalizeMockIds();

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
    const userId = user._id || resolveId(user.id);
    await pool.query(
      `INSERT INTO users (
        id, email, name, phone, avatar, location_lat, location_lng, location_address,
        preferences_categories, preferences_price_range, email_verified, phone_verified,
        marketing_consent, account_status, created_at, password_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        avatar = EXCLUDED.avatar,
        location_lat = EXCLUDED.location_lat,
        location_lng = EXCLUDED.location_lng,
        location_address = EXCLUDED.location_address,
        preferences_categories = EXCLUDED.preferences_categories,
        preferences_price_range = EXCLUDED.preferences_price_range,
        password_hash = EXCLUDED.password_hash`,
      [
        userId,
        user.email,
        user.name,
        user.phone,
        user.avatar,
        user.location?.lat || null,
        user.location?.lng || null,
        user.location?.address || null,
        user.preferences?.categories || [],
        user.preferences?.priceRange || '$$',
        true,
        true,
        user.preferences?.marketingConsent || false,
        'active',
        user.joinDate || new Date().toISOString(),
        defaultPassword,
      ]
    );
  }
  
  console.log(`✓ Seeded ${users.length} users`);
}

// Seed business users
async function seedBusinessUsers() {
  console.log('Seeding business users...');
  const defaultPassword = await hashPassword('Password123!');
  
  for (const business of businessUsers) {
    const bId = business._id || resolveId(business.id);
    // Provide defaults for address fields required by the schema
    const addressStreet = business.address_street || business.addressStreet || business.address || 'Unknown Street';
    const addressCity = business.address_city || business.addressCity || business.city || 'Unknown City';
    const addressState = business.address_state || business.addressState || 'Unknown State';
    const addressPostal = business.address_postal_code || business.postalCode || business.postal_code || '00000';
    const addressCountry = business.address_country || business.addressCountry || 'UAE';

    await pool.query(
      `INSERT INTO business_users (
        id, email, business_name, owner_name, phone, business_type, registration_number,
        years_in_operation, subscription_tier, email_verified, phone_verified,
        business_verified, verification_status, account_status, created_at, password_hash,
        address_street, address_city, address_state, address_postal_code, address_country
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        business_name = EXCLUDED.business_name,
        owner_name = EXCLUDED.owner_name,
        phone = EXCLUDED.phone,
        password_hash = EXCLUDED.password_hash,
        address_street = EXCLUDED.address_street,
        address_city = EXCLUDED.address_city,
        address_state = EXCLUDED.address_state,
        address_postal_code = EXCLUDED.address_postal_code,
        address_country = EXCLUDED.address_country`,
      [
        bId,
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
        defaultPassword,
        addressStreet,
        addressCity,
        addressState,
        addressPostal,
        addressCountry,
      ]
    );
  }
  
  console.log(`✓ Seeded ${businessUsers.length} business users`);
}

// Seed venues
async function seedVenues() {
  console.log('Seeding venues...');
  
  // Create a mapping from business user to venue using normalized ids
  const businessVenueMap: Record<string, string[]> = {};
  businessUsers.forEach((bu: any) => {
    businessVenueMap[bu._id] = bu._locations || [];
  });

  const allVenues = normalizedVenues;

  for (const venue of allVenues) {
    // Find business user that owns this venue
    let businessUserId: string | null = null;
    for (const [buId, venueIds] of Object.entries(businessVenueMap)) {
      if (venueIds.includes(venue._id) || venueIds.includes(venue.id)) {
        businessUserId = buId;
        break;
      }
    }

    // If no business user found in mapping, try to find matching business in-memory
    if (!businessUserId) {
      const matchingBusiness = businessUsers.find(
        (bu: any) => bu.businessType === venue.category
      );
      businessUserId = matchingBusiness?._id || businessUsers[0]._id;
    }

    // Ensure the business_user_id exists in the database. If not, try to
    // find a fallback business_user with the same business_type or any business_user.
    const existsRes = await pool.query('SELECT id FROM business_users WHERE id = $1 LIMIT 1', [businessUserId]);
    if (existsRes.rowCount === 0) {
      // try to find by business_type
      const fallbackRes = await pool.query('SELECT id FROM business_users WHERE business_type = $1 LIMIT 1', [venue.category]);
      if (fallbackRes.rowCount > 0) {
        businessUserId = fallbackRes.rows[0].id;
      } else {
        const anyRes = await pool.query('SELECT id FROM business_users LIMIT 1');
        if (anyRes.rowCount > 0) {
          businessUserId = anyRes.rows[0].id;
        } else {
          throw new Error('No business_users found in database; run seed:business first');
        }
      }
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
        venue._id,
        businessUserId,
        venue.name,
        venue.category,
        venue.description,
        venue.image,
        venue.rating,
        venue.reviews,
        venue.price,
        venue.priceLabel,
        venue.location?.lat || null,
        venue.location?.lng || null,
        venue.location?.address || null,
        venue.location?.city || null,
        venue.amenities || [],
        venue.status,
        venue.occupancy,
        venue.capacity,
        venue.verified,
        venue.openNow,
        attributes,
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
    const bId = booking._id || resolveId(booking.id);
    const userId = booking._userId || resolveId(booking.userId || booking.user);
    const venueId = booking._venueId || resolveId(booking.venueId || booking.venue);
    await pool.query(
      `INSERT INTO bookings (
        id, user_id, venue_id, venue_type, booking_date, booking_time, duration,
        status, total_price, attendees, special_requests, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        total_price = EXCLUDED.total_price`,
      [
        bId,
        userId,
        venueId,
        booking.venueType || booking.venue_type || null,
        booking.date || booking.booking_date || null,
        booking.time || booking.booking_time || null,
        booking.duration || 60,
        booking.status || 'pending',
        booking.totalPrice || booking.total_price || 0,
        booking.attendees || 1,
        booking.specialRequests || booking.special_requests || null,
        booking.bookingDate || booking.createdAt || new Date().toISOString(),
      ]
    );
  }
  
  console.log(`✓ Seeded ${bookings.length} bookings`);
}

// Seed reviews
async function seedReviews() {
  console.log('Seeding reviews...');
  
  for (const review of reviews) {
    const rId = review._id || resolveId(review.id);
    const userId = review._userId || resolveId(review.userId || review.user);
    const venueId = review._venueId || resolveId(review.venueId || review.venue);
    await pool.query(
      `INSERT INTO reviews (
        id, user_id, venue_id, rating, comment, helpful_count, business_reply, business_reply_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        helpful_count = EXCLUDED.helpful_count`,
      [
        rId,
        userId,
        venueId,
        review.rating,
        review.comment,
        review.helpful || 0,
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
    const userId = user._id || resolveId(user.id);
    for (const venueId of user._favorites || []) {
      await pool.query(
        `INSERT INTO favorites (user_id, venue_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, venue_id) DO NOTHING`,
        [userId, venueId]
      );
    }
  }
  
  const totalFavorites = users.reduce((sum: number, u: any) => sum + (u._favorites?.length || 0), 0);
  console.log(`✓ Seeded ${totalFavorites} favorites`);
}

// Seed notifications
async function seedNotifications() {
  console.log('Seeding notifications...');
  
  for (const notification of notifications) {
    const nId = resolveId(notification.id);
    const userId = resolveId(notification.userId);
    await pool.query(
      `INSERT INTO notifications (
        id, user_id, user_type, type, title, message, related_entity, action_url,
        action_label, priority, read, delivery_channels, delivery_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        read = EXCLUDED.read`,
      [
        nId,
        userId,
        notification.userType,
        notification.type,
        notification.title,
        notification.message,
        notification.relatedEntity || {},
        notification.actionUrl,
        notification.actionLabel,
        notification.priority || 'medium',
        notification.read || false,
        notification.deliveryChannels || [],
        notification.deliveryStatus || {},
        notification.createdAt || new Date().toISOString(),
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
