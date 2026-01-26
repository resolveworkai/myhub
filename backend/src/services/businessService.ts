import { pool } from '../db/pool';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { bookingService } from './bookingService';

interface UpdateBusinessData {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  description?: string;
  specialties?: string[];
  serviceAreas?: string;
  dailyPackagePrice?: number;
  weeklyPackagePrice?: number;
  monthlyPackagePrice?: number;
}

class BusinessService {
  /**
   * Get business profile
   */
  async getBusinessProfile(businessUserId: string) {
    const result = await pool.query(
      `SELECT * FROM business_users WHERE id = $1 AND deleted_at IS NULL`,
      [businessUserId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Business not found');
    }

    return this.formatBusiness(result.rows[0]);
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(businessUserId: string, data: UpdateBusinessData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (data.businessName !== undefined) {
        paramCount++;
        updates.push(`business_name = $${paramCount}`);
        params.push(data.businessName);
      }

      if (data.ownerName !== undefined) {
        paramCount++;
        updates.push(`owner_name = $${paramCount}`);
        params.push(data.ownerName);
      }

      if (data.phone !== undefined) {
        paramCount++;
        updates.push(`phone = $${paramCount}`);
        params.push(data.phone);
      }

      if (data.website !== undefined) {
        paramCount++;
        updates.push(`website = $${paramCount}`);
        params.push(data.website);
      }

      if (data.address !== undefined) {
        if (data.address.street !== undefined) {
          paramCount++;
          updates.push(`address_street = $${paramCount}`);
          params.push(data.address.street);
        }
        if (data.address.city !== undefined) {
          paramCount++;
          updates.push(`address_city = $${paramCount}`);
          params.push(data.address.city);
        }
        if (data.address.state !== undefined) {
          paramCount++;
          updates.push(`address_state = $${paramCount}`);
          params.push(data.address.state);
        }
        if (data.address.postalCode !== undefined) {
          paramCount++;
          updates.push(`address_postal_code = $${paramCount}`);
          params.push(data.address.postalCode);
        }
        if (data.address.country !== undefined) {
          paramCount++;
          updates.push(`address_country = $${paramCount}`);
          params.push(data.address.country);
        }
        if (data.address.lat !== undefined) {
          paramCount++;
          updates.push(`address_lat = $${paramCount}`);
          params.push(data.address.lat);
        }
        if (data.address.lng !== undefined) {
          paramCount++;
          updates.push(`address_lng = $${paramCount}`);
          params.push(data.address.lng);
        }
      }

      if (data.specialties !== undefined) {
        paramCount++;
        updates.push(`specialties = $${paramCount}`);
        params.push(data.specialties);
      }

      if (data.serviceAreas !== undefined) {
        paramCount++;
        updates.push(`service_areas = $${paramCount}`);
        params.push(data.serviceAreas);
      }

      if (data.dailyPackagePrice !== undefined) {
        paramCount++;
        updates.push(`daily_package_price = $${paramCount}`);
        params.push(data.dailyPackagePrice);
      }

      if (data.weeklyPackagePrice !== undefined) {
        paramCount++;
        updates.push(`weekly_package_price = $${paramCount}`);
        params.push(data.weeklyPackagePrice);
      }

      if (data.monthlyPackagePrice !== undefined) {
        paramCount++;
        updates.push(`monthly_package_price = $${paramCount}`);
        params.push(data.monthlyPackagePrice);
      }

      if (updates.length === 0) {
        return await this.getBusinessProfile(businessUserId);
      }

      params.push(businessUserId);
      paramCount++;

      const result = await client.query(
        `UPDATE business_users
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        params
      );

      await client.query('COMMIT');

      logger.info('Business profile updated', { businessUserId });

      return this.formatBusiness(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get business members
   */
  async getBusinessMembers(businessUserId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM business_members WHERE business_user_id = $1`,
      [businessUserId]
    );
    const total = parseInt(countResult.rows[0].total);

    // Get members
    const result = await pool.query(
      `SELECT bm.*, u.name, u.email, u.phone, u.avatar, m.status as membership_status, m.end_date
       FROM business_members bm
       JOIN users u ON bm.user_id = u.id
       LEFT JOIN memberships m ON bm.membership_id = m.id
       WHERE bm.business_user_id = $1
       ORDER BY bm.assigned_at DESC
       LIMIT $2 OFFSET $3`,
      [businessUserId, limit, offset]
    );

    return {
      members: result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        avatar: row.avatar,
        assignedAt: row.assigned_at,
        membershipStatus: row.membership_status,
        membershipEndDate: row.end_date,
        status: row.status,
        notes: row.notes,
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
   * Add business member with membership
   */
  async addBusinessMember(
    businessUserId: string,
    data: {
      userName: string;
      userEmail?: string;
      userPhone?: string;
      membershipType: 'daily' | 'weekly' | 'monthly';
      price: number;
      notes?: string;
    }
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get business venue (assuming one venue per business for now)
      const venueResult = await client.query(
        `SELECT id FROM venues WHERE business_user_id = $1 AND deleted_at IS NULL LIMIT 1`,
        [businessUserId]
      );

      if (venueResult.rows.length === 0) {
        throw new NotFoundError('No venue found for this business');
      }

      const venueId = venueResult.rows[0].id;

      // Check if user exists by email, otherwise create a guest user
      let userId: string;
      if (data.userEmail) {
        const userResult = await client.query(
          `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL`,
          [data.userEmail.toLowerCase()]
        );

        if (userResult.rows.length > 0) {
          userId = userResult.rows[0].id;
        } else {
          // Create guest user
          const newUserResult = await client.query(
            `INSERT INTO users (name, email, phone, account_status, email_verified)
             VALUES ($1, $2, $3, 'active', FALSE)
             RETURNING id`,
            [data.userName, data.userEmail.toLowerCase(), data.userPhone || null]
          );
          userId = newUserResult.rows[0].id;
        }
      } else {
        // Create guest user without email
        const newUserResult = await client.query(
          `INSERT INTO users (name, phone, account_status, email_verified)
           VALUES ($1, $2, 'active', FALSE)
           RETURNING id`,
          [data.userName, data.userPhone || null]
        );
        userId = newUserResult.rows[0].id;
      }

      // Calculate membership dates
      const startDate = new Date();
      const endDate = new Date();
      if (data.membershipType === 'daily') {
        endDate.setDate(endDate.getDate() + 1);
      } else if (data.membershipType === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (data.membershipType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Create membership
      const membershipResult = await client.query(
        `INSERT INTO memberships (user_id, venue_id, business_user_id, membership_type, start_date, end_date, price, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
         RETURNING id`,
        [userId, venueId, businessUserId, data.membershipType, startDate, endDate, data.price]
      );

      const membershipId = membershipResult.rows[0].id;

      // Add to business_members
      await client.query(
        `INSERT INTO business_members (business_user_id, user_id, membership_id, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (business_user_id, user_id) DO UPDATE SET membership_id = $3, notes = $4`,
        [businessUserId, userId, membershipId, data.notes || null]
      );

      await client.query('COMMIT');

      logger.info('Business member added with membership', { businessUserId, userId, membershipId });

      return { userId, membershipId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel membership
   */
  async cancelMembership(membershipId: string, businessUserId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify membership belongs to business
      const membershipResult = await client.query(
        `SELECT id, status, start_date, membership_type
         FROM memberships
         WHERE id = $1 AND business_user_id = $2`,
        [membershipId, businessUserId]
      );

      if (membershipResult.rows.length === 0) {
        throw new NotFoundError('Membership not found');
      }

      const membership = membershipResult.rows[0];

      // Check if monthly membership can be cancelled (30-day lock)
      if (membership.membership_type === 'monthly') {
        const startDate = new Date(membership.start_date);
        const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceStart < 30) {
          throw new ValidationError(`Monthly memberships cannot be cancelled within 30 days. ${30 - daysSinceStart} days remaining.`);
        }
      }

      if (membership.status === 'cancelled') {
        throw new ValidationError('Membership is already cancelled');
      }

      // Cancel membership
      await client.query(
        `UPDATE memberships SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [membershipId]
      );

      await client.query('COMMIT');

      logger.info('Membership cancelled', { membershipId, businessUserId });

      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(businessUserId: string) {
    const today = new Date().toISOString().split('T')[0];

    // Get total members
    const membersResult = await pool.query(
      `SELECT COUNT(*) as total FROM business_members WHERE business_user_id = $1`,
      [businessUserId]
    );

    // Get revenue this month
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(total_price), 0) as revenue
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       WHERE v.business_user_id = $1
       AND b.status = 'confirmed'
       AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
      [businessUserId]
    );

    // Get appointments today
    const appointmentsResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       WHERE v.business_user_id = $1
       AND b.booking_date = $2
       AND b.status IN ('confirmed', 'pending')`,
      [businessUserId, today]
    );

    // Get pending payments
    const paymentsResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN venues v ON b.venue_id = v.id
       WHERE v.business_user_id = $1
       AND p.payment_status = 'pending'`,
      [businessUserId]
    );

    return {
      totalMembers: parseInt(membersResult.rows[0].total),
      revenueThisMonth: parseFloat(revenueResult.rows[0].revenue) || 0,
      appointmentsToday: parseInt(appointmentsResult.rows[0].total),
      pendingPayments: parseFloat(paymentsResult.rows[0].total) || 0,
    };
  }

  /**
   * Get business analytics
   */
  async getBusinessAnalytics(businessUserId: string, period: string = 'month') {
    const dateFilter = this.getDateFilter(period);

    // Get bookings
    const bookingsResult = await pool.query(
      `SELECT COUNT(*) as total, SUM(total_price) as revenue
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       WHERE v.business_user_id = $1 AND b.created_at >= $2 AND b.status = 'confirmed'`,
      [businessUserId, dateFilter]
    );

    // Get members count
    const membersResult = await pool.query(
      `SELECT COUNT(*) as total FROM business_members WHERE business_user_id = $1`,
      [businessUserId]
    );

    // Get venues count
    const venuesResult = await pool.query(
      `SELECT COUNT(*) as total FROM venues WHERE business_user_id = $1 AND deleted_at IS NULL`,
      [businessUserId]
    );

    // Get reviews
    const reviewsResult = await pool.query(
      `SELECT AVG(r.rating) as avg_rating, COUNT(*) as total
       FROM reviews r
       JOIN venues v ON r.venue_id = v.id
       WHERE v.business_user_id = $1 AND r.created_at >= $2 AND r.deleted_at IS NULL`,
      [businessUserId, dateFilter]
    );

    // Get occupancy stats
    const occupancyResult = await pool.query(
      `SELECT AVG(occupancy::float / NULLIF(capacity, 0)) as avg_occupancy
       FROM venues
       WHERE business_user_id = $1 AND deleted_at IS NULL`,
      [businessUserId]
    );

    return {
      bookings: {
        total: parseInt(bookingsResult.rows[0].total) || 0,
        revenue: parseFloat(bookingsResult.rows[0].revenue) || 0,
      },
      members: {
        total: parseInt(membersResult.rows[0].total) || 0,
      },
      venues: {
        total: parseInt(venuesResult.rows[0].total) || 0,
      },
      reviews: {
        averageRating: parseFloat(reviewsResult.rows[0].avg_rating) || 0,
        total: parseInt(reviewsResult.rows[0].total) || 0,
      },
      occupancy: {
        average: parseFloat(occupancyResult.rows[0].avg_occupancy) || 0,
      },
    };
  }

  /**
   * Send announcement
   */
  async sendAnnouncement(
    businessUserId: string,
    title: string,
    message: string,
    memberIds?: string[]
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get member IDs if not provided
      let targetMemberIds: string[];
      if (memberIds && memberIds.length > 0) {
        targetMemberIds = memberIds;
      } else {
        const membersResult = await client.query(
          `SELECT user_id FROM business_members WHERE business_user_id = $1`,
          [businessUserId]
        );
        targetMemberIds = membersResult.rows.map((row: any) => row.user_id);
      }

      // Create notifications for each member
      for (const memberId of targetMemberIds) {
        await client.query(
          `INSERT INTO notifications (
            user_id, user_type, type, title, message, related_entity,
            action_url, action_label, priority, delivery_channels
          ) VALUES ($1, 'normal', 'announcement', $2, $3, $4, $5, $6, 'medium', $7)`,
          [
            memberId,
            title,
            message,
            JSON.stringify({ businessUserId }),
            '/dashboard',
            'View',
            ['in_app', 'email'],
          ]
        );
      }

      await client.query('COMMIT');

      logger.info('Announcement sent', { businessUserId, count: targetMemberIds.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get date filter for period
   */
  private getDateFilter(period: string): string {
    const now = new Date();
    let filterDate: Date;

    switch (period) {
      case 'week':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        filterDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        filterDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        filterDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    return filterDate.toISOString();
  }

  /**
   * Update business information
   */
  async updateBusinessInfo(
    businessUserId: string,
    data: {
      businessName?: string;
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
      description?: string;
    }
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (data.businessName !== undefined) {
        paramCount++;
        updates.push(`business_name = $${paramCount}`);
        params.push(data.businessName);
      }

      if (data.email !== undefined) {
        paramCount++;
        updates.push(`email = $${paramCount}`);
        params.push(data.email.toLowerCase());
      }

      if (data.phone !== undefined) {
        paramCount++;
        updates.push(`phone = $${paramCount}`);
        params.push(data.phone);
      }

      if (data.website !== undefined) {
        paramCount++;
        updates.push(`website = $${paramCount}`);
        params.push(data.website);
      }

      if (data.address !== undefined) {
        paramCount++;
        updates.push(`address_street = $${paramCount}`);
        params.push(data.address);
      }

      if (data.description !== undefined) {
        paramCount++;
        updates.push(`description = $${paramCount}`);
        params.push(data.description);
      }

      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }

      paramCount++;
      updates.push(`updated_at = NOW()`);
      params.push(businessUserId);

      await client.query(
        `UPDATE business_users SET ${updates.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL`,
        params
      );

      await client.query('COMMIT');

      logger.info('Business info updated', { businessUserId });

      return await this.getBusinessProfile(businessUserId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update location and media
   */
  async updateLocationAndMedia(
    businessUserId: string,
    data: {
      lat?: number;
      lng?: number;
      logo?: string;
      coverImage?: string;
      galleryImages?: string[];
    }
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (data.lat !== undefined) {
        paramCount++;
        updates.push(`address_lat = $${paramCount}`);
        params.push(data.lat);
      }

      if (data.lng !== undefined) {
        paramCount++;
        updates.push(`address_lng = $${paramCount}`);
        params.push(data.lng);
      }

      if (data.logo !== undefined) {
        paramCount++;
        updates.push(`logo = $${paramCount}`);
        params.push(data.logo);
      }

      if (data.coverImage !== undefined) {
        paramCount++;
        updates.push(`cover_image = $${paramCount}`);
        params.push(data.coverImage);
      }

      if (data.galleryImages !== undefined) {
        paramCount++;
        updates.push(`gallery_images = $${paramCount}`);
        params.push(data.galleryImages);
      }

      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }

      paramCount++;
      updates.push(`updated_at = NOW()`);
      params.push(businessUserId);

      await client.query(
        `UPDATE business_users SET ${updates.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL`,
        params
      );

      await client.query('COMMIT');

      logger.info('Location and media updated', { businessUserId });

      return await this.getBusinessProfile(businessUserId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update business attributes
   */
  async updateBusinessAttributes(
    businessUserId: string,
    attributes: Record<string, any>
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current attributes
      const currentResult = await client.query(
        `SELECT business_attributes FROM business_users WHERE id = $1 AND deleted_at IS NULL`,
        [businessUserId]
      );

      if (currentResult.rows.length === 0) {
        throw new NotFoundError('Business not found');
      }

      const currentAttributes = currentResult.rows[0].business_attributes || {};
      const mergedAttributes = { ...currentAttributes, ...attributes };

      await client.query(
        `UPDATE business_users 
         SET business_attributes = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL`,
        [JSON.stringify(mergedAttributes), businessUserId]
      );

      await client.query('COMMIT');

      logger.info('Business attributes updated', { businessUserId });

      return await this.getBusinessProfile(businessUserId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update pricing packages
   */
  async updatePricing(
    businessUserId: string,
    data: {
      dailyPackagePrice?: number;
      weeklyPackagePrice?: number;
      monthlyPackagePrice?: number;
    }
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (data.dailyPackagePrice !== undefined) {
        paramCount++;
        updates.push(`daily_package_price = $${paramCount}`);
        params.push(data.dailyPackagePrice);
      }

      if (data.weeklyPackagePrice !== undefined) {
        paramCount++;
        updates.push(`weekly_package_price = $${paramCount}`);
        params.push(data.weeklyPackagePrice);
      }

      if (data.monthlyPackagePrice !== undefined) {
        paramCount++;
        updates.push(`monthly_package_price = $${paramCount}`);
        params.push(data.monthlyPackagePrice);
      }

      if (updates.length === 0) {
        throw new ValidationError('No pricing fields to update');
      }

      paramCount++;
      updates.push(`updated_at = NOW()`);
      params.push(businessUserId);

      await client.query(
        `UPDATE business_users SET ${updates.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL`,
        params
      );

      await client.query('COMMIT');

      logger.info('Pricing updated', { businessUserId });

      return await this.getBusinessProfile(businessUserId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update operating hours
   */
  async updateOperatingHours(
    businessUserId: string,
    operatingHours: Record<string, any>
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE business_users 
         SET operating_hours = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL`,
        [JSON.stringify(operatingHours), businessUserId]
      );

      await client.query('COMMIT');

      logger.info('Operating hours updated', { businessUserId });

      return await this.getBusinessProfile(businessUserId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    businessUserId: string,
    preferences: Record<string, any>
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current preferences
      const currentResult = await client.query(
        `SELECT notification_preferences FROM business_users WHERE id = $1 AND deleted_at IS NULL`,
        [businessUserId]
      );

      if (currentResult.rows.length === 0) {
        throw new NotFoundError('Business not found');
      }

      const currentPreferences = currentResult.rows[0].notification_preferences || {};
      const mergedPreferences = { ...currentPreferences, ...preferences };

      await client.query(
        `UPDATE business_users 
         SET notification_preferences = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL`,
        [JSON.stringify(mergedPreferences), businessUserId]
      );

      await client.query('COMMIT');

      logger.info('Notification preferences updated', { businessUserId });

      return await this.getBusinessProfile(businessUserId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(
    businessUserId: string,
    settings: Record<string, any>
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current settings
      const currentResult = await client.query(
        `SELECT security_settings FROM business_users WHERE id = $1 AND deleted_at IS NULL`,
        [businessUserId]
      );

      if (currentResult.rows.length === 0) {
        throw new NotFoundError('Business not found');
      }

      const currentSettings = currentResult.rows[0].security_settings || {};
      const mergedSettings = { ...currentSettings, ...settings };

      await client.query(
        `UPDATE business_users 
         SET security_settings = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL`,
        [JSON.stringify(mergedSettings), businessUserId]
      );

      await client.query('COMMIT');

      logger.info('Security settings updated', { businessUserId });

      return await this.getBusinessProfile(businessUserId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Toggle publish status
   */
  async togglePublishStatus(businessUserId: string, isPublished: boolean) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE business_users 
         SET is_published = $1, 
             published_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
             updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL`,
        [isPublished, businessUserId]
      );

      await client.query('COMMIT');

      logger.info('Publish status toggled', { businessUserId, isPublished });

      return await this.getBusinessProfile(businessUserId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Format business for response
   */
  private formatBusiness(row: any) {
    const operatingHours = row.operating_hours ? JSON.parse(JSON.stringify(row.operating_hours)) : {};
    const notificationPreferences = row.notification_preferences ? JSON.parse(JSON.stringify(row.notification_preferences)) : {};
    const securitySettings = row.security_settings ? JSON.parse(JSON.stringify(row.security_settings)) : {};
    const businessAttributes = row.business_attributes ? JSON.parse(JSON.stringify(row.business_attributes)) : {};

    return {
      id: row.id,
      email: row.email,
      businessName: row.business_name,
      ownerName: row.owner_name,
      phone: row.phone,
      businessType: row.business_type,
      registrationNumber: row.registration_number,
      address: {
        street: row.address_street,
        city: row.address_city,
        state: row.address_state,
        postalCode: row.address_postal_code,
        country: row.address_country,
        lat: parseFloat(row.address_lat) || null,
        lng: parseFloat(row.address_lng) || null,
      },
      website: row.website,
      description: row.description,
      subscriptionTier: row.subscription_tier,
      subscriptionStatus: row.subscription_status,
      emailVerified: row.email_verified,
      businessVerified: row.business_verified,
      verificationStatus: row.verification_status,
      accountStatus: row.account_status,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      dailyPackagePrice: parseFloat(row.daily_package_price) || 0,
      weeklyPackagePrice: parseFloat(row.weekly_package_price) || 0,
      monthlyPackagePrice: parseFloat(row.monthly_package_price) || 0,
      operatingHours,
      logo: row.logo,
      coverImage: row.cover_image,
      galleryImages: row.gallery_images || [],
      notificationPreferences,
      securitySettings,
      businessAttributes,
      createdAt: row.created_at,
    };
  }
}

export const businessService = new BusinessService();
