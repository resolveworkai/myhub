import { pool } from '../db/pool';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import bcrypt from 'bcrypt';
import { config } from '../config';

interface UpdateUserData {
  name?: string;
  phone?: string;
  location?: { lat: number; lng: number; address: string };
  preferences?: {
    categories?: string[];
    priceRange?: string;
  };
  marketingConsent?: boolean;
  avatar?: string;
  notificationPreferences?: Record<string, any>;
}

class UserService {
  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    const result = await pool.query(
      `SELECT 
        id, email, name, phone, country_code, avatar,
        location_lat, location_lng, location_address,
        preferences_categories, preferences_price_range,
        email_verified, phone_verified, marketing_consent,
        account_status, created_at, last_login,
        notification_preferences
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return this.formatUser(result.rows[0]);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: UpdateUserData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (data.name !== undefined) {
        paramCount++;
        updates.push(`name = $${paramCount}`);
        params.push(data.name);
      }

      if (data.phone !== undefined) {
        paramCount++;
        updates.push(`phone = $${paramCount}`);
        params.push(data.phone);
      }

      if (data.location !== undefined) {
        paramCount++;
        updates.push(`location_lat = $${paramCount}`);
        params.push(data.location.lat);
        paramCount++;
        updates.push(`location_lng = $${paramCount}`);
        params.push(data.location.lng);
        paramCount++;
        updates.push(`location_address = $${paramCount}`);
        params.push(data.location.address);
      }

      if (data.preferences !== undefined) {
        if (data.preferences.categories !== undefined) {
          paramCount++;
          updates.push(`preferences_categories = $${paramCount}`);
          params.push(data.preferences.categories);
        }
        if (data.preferences.priceRange !== undefined) {
          paramCount++;
          updates.push(`preferences_price_range = $${paramCount}`);
          params.push(data.preferences.priceRange);
        }
      }

      if (data.marketingConsent !== undefined) {
        paramCount++;
        updates.push(`marketing_consent = $${paramCount}`);
        params.push(data.marketingConsent);
      }

      if (data.avatar !== undefined) {
        paramCount++;
        updates.push(`avatar = $${paramCount}`);
        params.push(data.avatar);
      }

      if (data.notificationPreferences !== undefined) {
        // Get current preferences
        const currentResult = await client.query(
          `SELECT notification_preferences FROM users WHERE id = $1`,
          [userId]
        );
        const currentPreferences = currentResult.rows[0]?.notification_preferences || {};
        const mergedPreferences = { ...currentPreferences, ...data.notificationPreferences };
        
        paramCount++;
        updates.push(`notification_preferences = $${paramCount}`);
        params.push(JSON.stringify(mergedPreferences));
      }

      if (updates.length === 0) {
        return await this.getUserProfile(userId);
      }

      params.push(userId);
      paramCount++;

      const result = await client.query(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        params
      );

      await client.query('COMMIT');

      logger.info('User profile updated', { userId });

      return this.formatUser(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user favorites
   */
  async getUserFavorites(userId: string) {
    const result = await pool.query(
      `SELECT v.*, f.created_at as favorited_at
       FROM favorites f
       JOIN venues v ON f.venue_id = v.id
       WHERE f.user_id = $1 AND v.deleted_at IS NULL
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
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
      favoritedAt: row.favorited_at,
    }));
  }

  /**
   * Add favorite
   */
  async addFavorite(userId: string, venueId: string) {
    // Verify venue exists
    const venueResult = await pool.query(
      `SELECT id FROM venues WHERE id = $1 AND deleted_at IS NULL`,
      [venueId]
    );

    if (venueResult.rows.length === 0) {
      throw new NotFoundError('Venue not found');
    }

    await pool.query(
      `INSERT INTO favorites (user_id, venue_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, venue_id) DO NOTHING`,
      [userId, venueId]
    );

    logger.info('Favorite added', { userId, venueId });
  }

  /**
   * Remove favorite
   */
  async removeFavorite(userId: string, venueId: string) {
    const result = await pool.query(
      `DELETE FROM favorites WHERE user_id = $1 AND venue_id = $2`,
      [userId, venueId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Favorite not found');
    }

    logger.info('Favorite removed', { userId, venueId });
  }

  /**
   * Get user payments
   */
  async getUserPayments(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    // Get user email for member_email matching
    const userResult = await pool.query(
      `SELECT email FROM users WHERE id = $1`,
      [userId]
    );
    const userEmail = userResult.rows[0]?.email || '';

    // Get total count - check both user_id and member_email
    const countResult = await pool.query(
      `SELECT COUNT(*) as total 
       FROM payments 
       WHERE (user_id = $1 OR member_email = $2)`,
      [userId, userEmail]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get payments - check both user_id and member_email
    const result = await pool.query(
      `SELECT p.*, v.name as venue_name, b.booking_date, b.booking_time
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN venues v ON p.venue_id = v.id
       WHERE (p.user_id = $1 OR p.member_email = $2)
       ORDER BY p.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, userEmail, limit, offset]
    );

    return {
      payments: result.rows.map((row: any) => ({
        id: row.id,
        amount: parseFloat(row.amount) || 0,
        currency: row.currency,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        transactionId: row.transaction_id,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        venueName: row.venue_name,
        bookingDate: row.booking_date,
        bookingTime: row.booking_time,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current password hash
      const userResult = await client.query(
        `SELECT password_hash FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isValid = await bcrypt.compare(
        currentPassword,
        userResult.rows[0].password_hash
      );

      if (!isValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, config.bcrypt.rounds);

      // Update password
      await client.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [newPasswordHash, userId]
      );

      await client.query('COMMIT');

      logger.info('Password changed', { userId });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user dashboard data
   */
  async getUserDashboard(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    // Get today's schedule (bookings)
    const todayScheduleResult = await pool.query(
      `SELECT 
        b.id,
        b.booking_date,
        b.booking_time,
        b.duration,
        b.status,
        b.venue_type,
        v.name as venue_name,
        v.image as venue_image,
        v.location_address,
        bu.business_name,
        bu.id as business_id
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       JOIN business_users bu ON v.business_user_id = bu.id
       WHERE b.user_id = $1 
         AND b.booking_date = $2
         AND b.status IN ('pending', 'confirmed')
       ORDER BY b.booking_time ASC`,
      [userId, today]
    );

    // Get pending fees (unpaid payments and overdue memberships)
    const pendingFeesResult = await pool.query(
      `SELECT 
        p.id,
        p.amount,
        p.payment_status,
        p.created_at,
        v.name as venue_name,
        bu.business_name,
        bu.id as business_id,
        b.booking_date,
        'payment' as fee_type
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN venues v ON p.venue_id = v.id
       LEFT JOIN business_users bu ON COALESCE(v.business_user_id, (SELECT business_user_id FROM bookings WHERE id = p.booking_id LIMIT 1)) = bu.id
       WHERE (p.user_id = $1 OR p.member_email = (SELECT email FROM users WHERE id = $1))
         AND p.payment_status = 'pending'
       UNION ALL
       SELECT 
        m.id,
        m.price as amount,
        CASE WHEN m.end_date < CURRENT_DATE THEN 'overdue' ELSE 'pending' END as payment_status,
        m.created_at,
        v.name as venue_name,
        bu.business_name,
        bu.id as business_id,
        m.end_date as booking_date,
        'membership' as fee_type
       FROM memberships m
       JOIN venues v ON m.venue_id = v.id
       JOIN business_users bu ON m.business_user_id = bu.id
       WHERE m.user_id = $1
         AND m.status = 'active'
         AND m.end_date >= CURRENT_DATE
         AND NOT EXISTS (
           SELECT 1 FROM payments 
           WHERE payment_status = 'completed' 
             AND (booking_id IN (SELECT id FROM bookings WHERE venue_id = m.venue_id AND user_id = $1)
                  OR venue_id = m.venue_id)
         )
       ORDER BY created_at DESC`,
      [userId]
    );

    // Get active enrollments (memberships)
    const enrollmentsResult = await pool.query(
      `SELECT 
        m.id,
        m.membership_type,
        m.start_date,
        m.end_date,
        m.price,
        m.status,
        m.auto_renew,
        v.id as venue_id,
        v.name as venue_name,
        v.image as venue_image,
        v.category,
        bu.id as business_id,
        bu.business_name,
        bu.business_type
       FROM memberships m
       JOIN venues v ON m.venue_id = v.id
       JOIN business_users bu ON m.business_user_id = bu.id
       WHERE m.user_id = $1
         AND m.status = 'active'
         AND m.end_date >= CURRENT_DATE
       ORDER BY m.end_date ASC`,
      [userId]
    );

    // Get dashboard stats
    const statsResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND status = 'completed') as total_visits,
        (SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND booking_date = $2 AND status IN ('pending', 'confirmed')) as upcoming_today,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE (user_id = $1 OR member_email = (SELECT email FROM users WHERE id = $1)) AND payment_status = 'pending') as pending_fees,
        (SELECT COUNT(*) FROM memberships WHERE user_id = $1 AND status = 'active' AND end_date >= CURRENT_DATE) as active_enrollments`,
      [userId, today]
    );

    const stats = statsResult.rows[0];

    return {
      todaySchedule: todayScheduleResult.rows.map((row: any) => ({
        id: row.id,
        businessName: row.business_name,
        businessId: row.business_id,
        venueName: row.venue_name,
        venueImage: row.venue_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.venue_name)}&background=random`,
        date: row.booking_date,
        time: row.booking_time,
        duration: row.duration,
        status: row.status,
        type: row.venue_type,
        address: row.location_address,
      })),
      pendingFees: pendingFeesResult.rows.map((row: any) => ({
        id: row.id,
        businessName: row.business_name,
        businessId: row.business_id,
        venueName: row.venue_name,
        amount: parseFloat(row.amount),
        status: row.payment_status,
        dueDate: row.booking_date,
        feeType: row.fee_type,
        createdAt: row.created_at,
      })),
      enrollments: enrollmentsResult.rows.map((row: any) => ({
        id: row.id,
        businessId: row.business_id,
        businessName: row.business_name,
        businessType: row.business_type,
        venueId: row.venue_id,
        venueName: row.venue_name,
        venueImage: row.venue_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.venue_name)}&background=random`,
        category: row.category,
        membershipType: row.membership_type,
        startDate: row.start_date,
        endDate: row.end_date,
        price: parseFloat(row.price),
        status: row.status,
        autoRenew: row.auto_renew,
        expiresIn: Math.ceil((new Date(row.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      })),
      stats: {
        totalVisits: parseInt(stats.total_visits) || 0,
        upcomingToday: parseInt(stats.upcoming_today) || 0,
        pendingFees: parseFloat(stats.pending_fees) || 0,
        activeEnrollments: parseInt(stats.active_enrollments) || 0,
      },
    };
  }

  /**
   * Format user for response
   */
  private formatUser(row: any) {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      countryCode: row.country_code,
      avatar: row.avatar,
      location: {
        lat: parseFloat(row.location_lat) || null,
        lng: parseFloat(row.location_lng) || null,
        address: row.location_address || null,
      },
      preferences: {
        categories: row.preferences_categories || [],
        priceRange: row.preferences_price_range || '$$',
      },
      emailVerified: row.email_verified,
      phoneVerified: row.phone_verified,
      marketingConsent: row.marketing_consent,
      accountStatus: row.account_status,
      joinDate: row.created_at,
      lastLogin: row.last_login,
    };
  }
}

export const userService = new UserService();
