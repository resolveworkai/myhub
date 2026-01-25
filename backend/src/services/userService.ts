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
        account_status, created_at, last_login
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

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM payments WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countResult.rows[0].total);

    // Get payments
    const result = await pool.query(
      `SELECT p.*, v.name as venue_name, b.booking_date, b.booking_time
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN venues v ON p.venue_id = v.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
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
