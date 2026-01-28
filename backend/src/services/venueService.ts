import { pool } from '../db/pool';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';

interface VenueFilters {
  category?: 'gym' | 'coaching' | 'library' | 'all';
  city?: string;
  minRating?: number;
  priceRange?: string;
  radius?: number;
  userLat?: number;
  userLng?: number;
  searchQuery?: string;
  amenities?: string[];
  status?: string;
  page?: number;
  limit?: number;
}

interface VenueAttributes {
  subjects?: string[];
  equipment?: string[];
  facilities?: string[];
  classTypes?: string[];
  membershipTypes?: string[];
  [key: string]: unknown;
}

class VenueService {
  /**
   * List venues with filters and pagination
   */
  async listVenues(filters: VenueFilters = {}) {
    const {
      category,
      city,
      minRating = 0,
      priceRange,
      radius,
      userLat,
      userLng,
      searchQuery,
      amenities = [],
      status,
      page = 1,
      limit = 12,
    } = filters;

    const offset = (page - 1) * limit;
    const conditions: string[] = ['v.deleted_at IS NULL', 'v.is_published = TRUE'];
    const params: (string | number | string[] | undefined)[] = [];
    let paramCount = 0;

    // Category filter
    if (category && category !== 'all') {
      paramCount++;
      conditions.push(`v.category = $${paramCount}`);
      params.push(category);
    }

    // City filter
    if (city) {
      paramCount++;
      conditions.push(`LOWER(v.location_city) = LOWER($${paramCount})`);
      params.push(city);
    }

    // Rating filter
    if (minRating > 0) {
      paramCount++;
      conditions.push(`v.rating >= $${paramCount}`);
      params.push(minRating);
    }

    // Price range filter
    if (priceRange) {
      // Check if it's a numeric range (e.g., "0,50000")
      if (priceRange.includes(',')) {
        const [minStr, maxStr] = priceRange.split(',');
        const min = parseFloat(minStr);
        const max = parseFloat(maxStr);
        if (!isNaN(min) && !isNaN(max)) {
          paramCount++;
          conditions.push(`v.price >= $${paramCount} AND v.price <= $${paramCount + 1}`);
          params.push(min, max);
          paramCount++;
        }
      } else {
        // Handle symbolic price ranges ($, $$, $$$)
        const priceMap: Record<string, { min: number; max: number }> = {
          $: { min: 0, max: 1000 },
          $$: { min: 1000, max: 3000 },
          $$$: { min: 3000, max: Infinity },
        };
        const range = priceMap[priceRange];
        if (range) {
          if (range.max === Infinity) {
            paramCount++;
            conditions.push(`v.price >= $${paramCount}`);
            params.push(range.min);
          } else {
            paramCount++;
            conditions.push(`v.price >= $${paramCount} AND v.price < $${paramCount + 1}`);
            params.push(range.min, range.max);
            paramCount++;
          }
        }
      }
    }

    // Search query
    if (searchQuery) {
      paramCount++;
      conditions.push(
        `(LOWER(v.name) LIKE LOWER($${paramCount}) OR LOWER(v.description) LIKE LOWER($${paramCount}))`
      );
      params.push(`%${searchQuery}%`);
    }

    // Amenities filter
    if (amenities.length > 0) {
      paramCount++;
      conditions.push(`v.amenities && $${paramCount}::text[]`);
      params.push(amenities);
    }

    // Status filter
    if (status && status !== 'all') {
      paramCount++;
      conditions.push(`v.status = $${paramCount}`);
      params.push(status);
    }

    // Distance filter (if user location provided)
    let distanceSelect = '';
    let distanceHaving = '';
    let userLatParamIndex: number | null = null;
    let userLngParamIndex: number | null = null;
    let radiusParamIndex: number | null = null;
    
    if (userLat && userLng && radius) {
      paramCount++;
      userLatParamIndex = paramCount;
      userLngParamIndex = paramCount + 1;
      distanceSelect = `, (
        6371 * acos(
          cos(radians($${userLatParamIndex})) * 
          cos(radians(v.location_lat)) * 
          cos(radians(v.location_lng) - radians($${userLngParamIndex})) + 
          sin(radians($${userLatParamIndex})) * 
          sin(radians(v.location_lat))
        )
      ) as distance`;
      params.push(userLat, userLng);
      paramCount += 2;
      radiusParamIndex = paramCount;
      distanceHaving = `HAVING distance <= $${radiusParamIndex}`;
      params.push(radius);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    // If distance filter is used, we need to calculate distance in a subquery
    let countQuery: string;
    const countParams: (string | number | string[] | undefined)[] = [];
    
    // Rebuild params for count query (excluding limit/offset)
    let countParamCount = 0;
    const countConditions: string[] = [];
    
    // Rebuild conditions for count query
    if (category && category !== 'all') {
      countParamCount++;
      countConditions.push(`v.category = $${countParamCount}`);
      countParams.push(category);
    }
    
    if (city) {
      countParamCount++;
      countConditions.push(`LOWER(v.location_city) = LOWER($${countParamCount})`);
      countParams.push(city);
    }
    
    if (minRating !== undefined) {
      countParamCount++;
      countConditions.push(`v.rating >= $${countParamCount}`);
      countParams.push(minRating);
    }
    
    if (priceRange) {
      const priceMap: Record<string, { min: number; max: number }> = {
        $: { min: 0, max: 1000 },
        $$: { min: 1000, max: 3000 },
        $$$: { min: 3000, max: Infinity },
      };
      let range = priceMap[priceRange];

      if (!range && priceRange.includes(',')) {
        const [min, max] = priceRange.split(',').map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          range = { min, max };
        }
      }

      if (range) {
        if (range.max === Infinity) {
          countParamCount++;
          countConditions.push(`v.price >= $${countParamCount}`);
          countParams.push(range.min);
        } else {
          countParamCount++;
          countConditions.push(`v.price >= $${countParamCount} AND v.price < $${countParamCount + 1}`);
          countParams.push(range.min, range.max);
          countParamCount++;
        }
      }
    }
    
    if (status && status !== 'all') {
      countParamCount++;
      countConditions.push(`v.status = $${countParamCount}`);
      countParams.push(status);
    }
    
    if (searchQuery) {
      countParamCount++;
      countConditions.push(`(LOWER(v.name) LIKE LOWER($${countParamCount}) OR LOWER(v.description) LIKE LOWER($${countParamCount}))`);
      countParams.push(`%${searchQuery}%`);
    }
    
    const countWhereClause = countConditions.length > 0 ? `WHERE ${countConditions.join(' AND ')}` : '';
    
    if (userLat && userLng && radius) {
      // Use subquery to calculate distance and filter by it
      const latParamIdx = countParamCount + 1;
      const lngParamIdx = countParamCount + 2;
      const radiusParamIdx = countParamCount + 3;
      
      countQuery = `
        SELECT COUNT(*) as total
        FROM (
          SELECT v.id, (
            6371 * acos(
              cos(radians($${latParamIdx})) * 
              cos(radians(v.location_lat)) * 
              cos(radians(v.location_lng) - radians($${lngParamIdx})) + 
              sin(radians($${latParamIdx})) * 
              sin(radians(v.location_lat))
            )
          ) as distance
          FROM venues v
          ${countWhereClause}
        ) subquery
        WHERE distance <= $${radiusParamIdx}
      `;
      countParams.push(userLat, userLng, radius);
    } else {
      countQuery = `
        SELECT COUNT(*) as total
        FROM venues v
        ${countWhereClause}
      `;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Get venues
    const orderBy = distanceSelect ? 'ORDER BY distance ASC' : 'ORDER BY v.rating DESC, v.reviews_count DESC';
    const query = `
      SELECT 
        v.*,
        bu.business_name,
        bu.owner_name,
        bu.subscription_tier
        ${distanceSelect}
      FROM venues v
      LEFT JOIN business_users bu ON v.business_user_id = bu.id
      ${whereClause}
      ${distanceHaving}
      ${orderBy}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const venues = result.rows.map(this.formatVenue);

    return {
      venues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get venue by ID
   */
  async getVenueById(id: string) {
    const result = await pool.query(
      `SELECT v.*, bu.business_name, bu.owner_name, bu.subscription_tier
       FROM venues v
       LEFT JOIN business_users bu ON v.business_user_id = bu.id
       WHERE v.id = $1 AND v.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Venue not found');
    }

    return this.formatVenue(result.rows[0]);
  }

  /**
   * Get venue schedule
   */
  async getVenueSchedule(venueId: string, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT * FROM schedules
       WHERE venue_id = $1 AND date = $2
       ORDER BY time_slot ASC`,
      [venueId, targetDate]
    );

    return result.rows;
  }

  /**
   * Get venue reviews
   */
  async getVenueReviews(venueId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM reviews WHERE venue_id = $1 AND deleted_at IS NULL`,
      [venueId]
    );
    const total = parseInt(countResult.rows[0].total);

    // Get reviews
    const result = await pool.query(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.venue_id = $1 AND r.deleted_at IS NULL
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [venueId, limit, offset]
    );

    return {
      reviews: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check venue availability
   */
  async checkAvailability(venueId: string, date: string, time: string) {
    // Get venue capacity
    const venueResult = await pool.query(
      `SELECT capacity, status FROM venues WHERE id = $1`,
      [venueId]
    );

    if (venueResult.rows.length === 0) {
      throw new NotFoundError('Venue not found');
    }

    const { capacity, status } = venueResult.rows[0];

    // Get schedule for this time slot
    const scheduleResult = await pool.query(
      `SELECT * FROM schedules
       WHERE venue_id = $1 AND date = $2 AND time_slot = $3`,
      [venueId, date, time]
    );

    let availableSlots = capacity;
    if (scheduleResult.rows.length > 0) {
      const schedule = scheduleResult.rows[0];
      availableSlots = schedule.available_slots;
    }

    // Count existing bookings for this slot
    const bookingResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings
       WHERE venue_id = $1 AND booking_date = $2 AND booking_time = $3
       AND status IN ('pending', 'confirmed')`,
      [venueId, date, time]
    );

    const bookedCount = parseInt(bookingResult.rows[0].count);
    const actuallyAvailable = Math.max(0, availableSlots - bookedCount);

    return {
      available: actuallyAvailable > 0,
      availableSlots: actuallyAvailable,
      totalSlots: capacity,
      status,
    };
  }

  /**
   * Format venue for response
   */
  private formatVenue(row: {
    id: string;
    name: string;
    category: string;
    description: string | null;
    price: string | number;
    location_address: string | null;
    location_city: string | null;
    location_lat: number | null;
    location_lng: number | null;
    capacity: number;
    status: string;
    rating: string | number;
    reviews_count: number;
    image: string | null;
    amenities: string[] | null;
    is_published: boolean;
    verified: boolean;
    business_user_id: string | null;
    business_name: string | null;
    owner_name: string | null;
    subscription_tier: string | null;
    distance?: number;
    attributes?: string;
    price_label?: string;
    occupancy?: number;
    open_now?: boolean;
  }) {
    const attributes: VenueAttributes = row.attributes ? JSON.parse(row.attributes) : {};
    
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      image: row.image,
      rating: parseFloat(row.rating) || 0,
      reviews: row.reviews_count || 0,
      price: parseFloat(row.price) || 0,
      priceLabel: row.price_label || `₹${row.price}`,
      location: {
        lat: parseFloat(row.location_lat),
        lng: parseFloat(row.location_lng),
        address: row.location_address,
        city: row.location_city,
      },
      amenities: row.amenities || [],
      status: row.status,
      occupancy: row.occupancy || 0,
      capacity: row.capacity || 100,
      verified: row.verified,
      openNow: row.open_now,
      attributes,
      businessName: row.business_name,
      distance: row.distance ? parseFloat(row.distance) : undefined,
    };
  }
}

export const venueService = new VenueService();
