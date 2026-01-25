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
   * Add business member
   */
  async addBusinessMember(businessUserId: string, userId: string, notes?: string) {
    // Verify user exists
    const userResult = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    await pool.query(
      `INSERT INTO business_members (business_user_id, user_id, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (business_user_id, user_id) DO UPDATE SET notes = $3`,
      [businessUserId, userId, notes || null]
    );

    logger.info('Business member added', { businessUserId, userId });
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
   * Format business for response
   */
  private formatBusiness(row: any) {
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
      subscriptionTier: row.subscription_tier,
      subscriptionStatus: row.subscription_status,
      emailVerified: row.email_verified,
      businessVerified: row.business_verified,
      verificationStatus: row.verification_status,
      accountStatus: row.account_status,
      isPublished: row.is_published,
      dailyPackagePrice: parseFloat(row.daily_package_price) || 0,
      weeklyPackagePrice: parseFloat(row.weekly_package_price) || 0,
      monthlyPackagePrice: parseFloat(row.monthly_package_price) || 0,
      createdAt: row.created_at,
    };
  }
}

export const businessService = new BusinessService();
