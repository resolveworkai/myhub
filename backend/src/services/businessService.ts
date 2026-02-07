import { pool } from '../db/pool';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { authService } from './authService';
import { calculateMembershipStatus } from '../utils/membershipStatus';

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
   * Get business venue ID (first venue for the business)
   */
  async getBusinessVenueId(businessUserId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT id FROM venues WHERE business_user_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [businessUserId]
    );

    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(businessUserId: string, data: UpdateBusinessData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const updates: string[] = [];
      const params: (string | number | boolean | null | undefined)[] = [];
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
   * Get business members (from standalone table)
   * Calculates status dynamically based on end_date for active/overdue/expired
   * Preserves cancelled status as-is
   */
  async getBusinessMembers(
    businessUserId: string,
    page: number = 1,
    limit: number = 20,
    filters?: { search?: string; status?: string; type?: string }
  ) {
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clauses
    const whereClauses: string[] = ['business_user_id = $1', 'deleted_at IS NULL'];
    const params: (string | number)[] = [businessUserId];
    let paramIndex = 2;

    if (filters?.search) {
      whereClauses.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Note: Status filter is applied after calculation in application layer
    // This allows us to filter by calculated status (overdue) not just stored status

    if (filters?.type) {
      whereClauses.push(`membership_type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }

    const whereSQL = whereClauses.join(' AND ');

    // Get total count with filters (excluding status filter for now)
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM business_members_standalone WHERE ${whereSQL}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get members with filters
    const result = await pool.query(
      `SELECT 
        id, business_user_id, venue_id, name, email, phone,
        membership_type, price, start_date, end_date, status, notes,
        assigned_at, created_at, updated_at
       FROM business_members_standalone
       WHERE ${whereSQL}
       ORDER BY assigned_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    // Calculate status for each member
    const membersWithCalculatedStatus = result.rows.map((row: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      membership_type: string;
      price: string | number;
      start_date: string;
      end_date: string;
      status: string;
      notes: string | null;
      assigned_at: string;
    }) => {
      // Calculate current status based on end_date
      const calculatedStatus = calculateMembershipStatus({
        endDate: row.end_date,
        currentStatus: row.status,
      });

      return {
        id: row.id,
        userId: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        avatar: null,
        assignedAt: row.assigned_at,
        membershipStatus: calculatedStatus,
        membershipEndDate: row.end_date,
        membershipType: row.membership_type,
        price: parseFloat(String(row.price)),
        startDate: row.start_date,
        status: calculatedStatus, // Use calculated status
        notes: row.notes,
      };
    });

    // Apply status filter after calculation
    let filteredMembers = membersWithCalculatedStatus;
    if (filters?.status) {
      filteredMembers = membersWithCalculatedStatus.filter(
        (member) => member.status === filters.status
      );
    }

    // For accurate total count with status filter, we need to fetch all matching records
    // and calculate their status. This ensures pagination works correctly.
    let finalTotal = total;
    if (filters?.status) {
      // Get all matching records (without pagination) to count correctly
      const allResult = await pool.query(
        `SELECT end_date, status
         FROM business_members_standalone
         WHERE ${whereSQL}`,
        params
      );
      
      // Count records matching the status filter
      const matchingCount = allResult.rows.filter((row: { end_date: string; status: string }) => {
        const calculatedStatus = calculateMembershipStatus({
          endDate: row.end_date,
          currentStatus: row.status,
        });
        return calculatedStatus === filters.status;
      }).length;
      
      finalTotal = matchingCount;
    }

    return {
      members: filteredMembers,
      pagination: {
        page,
        limit,
        total: finalTotal,
        totalPages: Math.ceil(finalTotal / limit),
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

      // Get or create business venue (assuming one venue per business for now)
      let venueResult = await client.query(
        `SELECT id FROM venues WHERE business_user_id = $1 AND deleted_at IS NULL LIMIT 1`,
        [businessUserId]
      );

      let venueId: string;
      if (venueResult.rows.length === 0) {
        // Get business info to create venue
        const businessResult = await client.query(
          `SELECT business_name, business_type, address_street, address_city, address_lat, address_lng, 
                  daily_package_price, weekly_package_price, monthly_package_price
           FROM business_users WHERE id = $1 AND deleted_at IS NULL`,
          [businessUserId]
        );

        if (businessResult.rows.length === 0) {
          throw new NotFoundError('Business not found');
        }

        const business = businessResult.rows[0];
        
        // Use default coordinates if business doesn't have location data
        // Default to Dubai, UAE coordinates (25.2048, 55.2708)
        const defaultLat = 25.2048;
        const defaultLng = 55.2708;
        const venueLat = business.address_lat ?? defaultLat;
        const venueLng = business.address_lng ?? defaultLng;
        
        // Create a default venue for the business
        const newVenueResult = await client.query(
          `INSERT INTO venues (
            business_user_id, name, category, description, price,
            location_address, location_city, location_lat, location_lng,
            capacity, status, is_published
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id`,
          [
            businessUserId,
            business.business_name,
            business.business_type,
            `Main location for ${business.business_name}`,
            business.daily_package_price || 299,
            business.address_street || 'Address not provided',
            business.address_city || 'City not provided',
            venueLat,
            venueLng,
            100, // default capacity
            'available',
            false, // not published by default
          ]
        );
        venueId = newVenueResult.rows[0].id;
        logger.info('Created default venue for business', { businessUserId, venueId });
      } else {
        venueId = venueResult.rows[0].id;
      }

      // Calculate membership dates
      const startDate = new Date();
      let endDate: Date = new Date();

      if (data.membershipType === 'daily') {
        endDate.setDate(endDate.getDate() + 1);
      } else if (data.membershipType === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (data.membershipType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Insert directly into business_members_standalone table (no user table relationship)
      const memberResult = await client.query(
        `INSERT INTO business_members_standalone (
          business_user_id, venue_id, name, email, phone, 
          membership_type, price, start_date, end_date, status, notes
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10)
         RETURNING *`,
        [
          businessUserId,
          venueId,
          data.userName,
          data.userEmail || null,
          data.userPhone || null,
          data.membershipType,
          data.price,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          data.notes || null,
        ]
      );

      // 🎯 Create associated payment record for the membership
      const dueDate = new Date(endDate);
      dueDate.setDate(dueDate.getDate() + 1); // Due date is 1 day after membership ends

      const paymentResult = await client.query(
        `INSERT INTO payments (
          venue_id, amount, currency, payment_method, payment_status,
          member_name, member_email, member_phone, business_member_id,
          due_date, payment_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          venueId,
          data.price,
          'INR',
          'pending_collection', // payment method for new add
          'pending',
          data.userName,
          data.userEmail || null,
          data.userPhone || null,
          memberResult.rows[0].id,
          dueDate.toISOString().split('T')[0],
          'membership',
        ]
      );

      await client.query('COMMIT');

      logger.info('Business member added with payment record', { 
        businessUserId, 
        memberId: memberResult.rows[0].id,
        paymentId: paymentResult.rows[0].id,
        membershipType: data.membershipType
      });

      return {
        id: memberResult.rows[0].id,
        name: data.userName,
        email: data.userEmail,
        phone: data.userPhone,
        membershipType: data.membershipType,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        price: data.price,
        paymentId: paymentResult.rows[0].id,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel membership (for standalone members)
   */
  async cancelMembership(memberId: string, businessUserId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const memberResult = await client.query(
        `SELECT id, status, start_date, membership_type
        FROM business_members_standalone
        WHERE id = $1 AND business_user_id = $2 AND deleted_at IS NULL`,
        [memberId, businessUserId]
      );

      if (memberResult.rows.length === 0) {
        throw new NotFoundError('Member not found');
      }

      const member = memberResult.rows[0];

      if (member.membership_type === 'monthly') {
        const startDate = new Date(member.start_date);
        const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceStart < 30) {
          throw new ValidationError(
            `Monthly memberships cannot be cancelled within 30 days. ${30 - daysSinceStart} days remaining.`
          );
        }
      }

      if (member.status === 'cancelled') {
        throw new ValidationError('Membership is already cancelled');
      }

      // ✅ ONLY cancel, do NOT delete
      await client.query(
        `UPDATE business_members_standalone 
        SET status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [memberId]
      );

      await client.query('COMMIT');

      logger.info('Membership cancelled', { memberId, businessUserId });

      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Renew/Extend membership subscription (for standalone members)
   * Creates a new payment record when subscription is renewed
   * Supports changing membership type and price
   */
  async renewMembership(
    memberId: string,
    businessUserId: string,
    renewalPrice: number,
    membershipType: 'daily' | 'weekly' | 'monthly'
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get member details
      const memberResult = await client.query(
        `SELECT id, name, email, phone, membership_type, price, end_date, venue_id
        FROM business_members_standalone
        WHERE id = $1 AND business_user_id = $2 AND deleted_at IS NULL`,
        [memberId, businessUserId]
      );

      if (memberResult.rows.length === 0) {
        throw new NotFoundError('Member not found');
      }

      const member = memberResult.rows[0];
      let newEndDate: Date = new Date(member.end_date);

      // Calculate new end date based on membership type
      if (membershipType === 'daily') {
        newEndDate.setDate(newEndDate.getDate() + 1);
      } else if (membershipType === 'weekly') {
        newEndDate.setDate(newEndDate.getDate() + 7);
      } else if (membershipType === 'monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      }

      // Update member with new end date, membership type, and price
      const updateQuery = `UPDATE business_members_standalone 
        SET end_date = $1,
            membership_type = $2,
            price = $3,
            status = 'active',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4`;

      const updateParams = [newEndDate.toISOString().split('T')[0], membershipType, renewalPrice, memberId];

      await client.query(updateQuery, updateParams);

      // 🎯 Create payment record for the renewal
      const dueDate = new Date(newEndDate);
      dueDate.setDate(dueDate.getDate() + 1); // Due date is 1 day after membership ends

      const paymentAmount = renewalPrice;

      const paymentResult = await client.query(
        `INSERT INTO payments (
          venue_id, amount, currency, payment_method, payment_status,
          member_name, member_email, member_phone, business_member_id,
          due_date, payment_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          member.venue_id,
          paymentAmount,
          'INR',
          'pending_collection',
          'pending',
          member.name,
          member.email || null,
          member.phone || null,
          memberId,
          dueDate.toISOString().split('T')[0],
          'membership_renewal',
        ]
      );

      await client.query('COMMIT');

      logger.info('Membership renewed with payment record', {
        memberId,
        businessUserId,
        paymentId: paymentResult.rows[0].id,
        newEndDate: newEndDate.toISOString().split('T')[0],
        newPrice: renewalPrice,
        membershipType,
      });

      return {
        memberId,
        newEndDate: newEndDate.toISOString().split('T')[0],
        newStatus: 'active',  // Status is always 'active' after renewal
        paymentId: paymentResult.rows[0].id,
        paymentAmount: renewalPrice,
        membershipType,
        membershipPrice: renewalPrice,
      };
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
      `SELECT COUNT(*) as total FROM business_members_standalone WHERE business_user_id = $1`,
      [businessUserId]
    );

    // Get revenue this month
    const revenueResult = await pool.query(
      // `SELECT COALESCE(SUM(total_price), 0) as revenue
      //  FROM bookings b
      //  JOIN venues v ON b.venue_id = v.id
      //  WHERE v.business_user_id = $1
      //  AND b.status = 'confirmed'
      //  AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
      `SELECT COALESCE(SUM(price), 0) AS revenue
      FROM business_members_standalone
      WHERE business_user_id = $1
      AND deleted_at IS NULL
      AND DATE_TRUNC('month', start_date) = DATE_TRUNC('month', CURRENT_DATE);`,
      [businessUserId]
    );

    // Get appointments today
    const appointmentsResult = await pool.query(
        `SELECT COUNT(*) as total
        FROM business_appointments_standalone b
        JOIN venues v ON b.venue_id = v.id
        WHERE v.business_user_id = $1
        AND b.appointment_date = $2
        AND b.status IN ('confirmed', 'pending')
        AND b.deleted_at IS NULL`,
      [businessUserId, today]
    );

    // Get pending payments
    const paymentsResult = await pool.query(
       `SELECT COALESCE(SUM(p.amount), 0) AS total
        FROM payments p
        JOIN venues v ON p.venue_id = v.id
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
        targetMemberIds = membersResult.rows.map((row: { user_id: string }) => row.user_id);
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
      const params: (string | number | boolean | null | undefined)[] = [];
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
      const params: (string | number | boolean | null | undefined)[] = [];
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
      const params: (string | number | boolean | null | undefined)[] = [];
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
   * Normalizes old format (single open/close) to new format (timeSlots array)
   */
  async updateOperatingHours(
    businessUserId: string,
    operatingHours: Record<string, any>
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Normalize operating hours: convert old format to new format if needed
      const normalizedHours: Record<string, any> = {};
      Object.entries(operatingHours).forEach(([day, hours]: [string, any]) => {
        // Check if it's already in new format (has timeSlots array)
        if (hours.timeSlots && Array.isArray(hours.timeSlots)) {
          normalizedHours[day] = {
            timeSlots: hours.timeSlots,
            closed: hours.closed ?? false,
          };
        } else if (hours.open && hours.close) {
          // Old format: convert single time slot to array
          normalizedHours[day] = {
            timeSlots: [{ open: hours.open, close: hours.close }],
            closed: hours.closed ?? false,
          };
        } else {
          // Invalid format, skip or set as closed
          normalizedHours[day] = {
            timeSlots: [],
            closed: true,
          };
        }
      });

      await client.query(
        `UPDATE business_users 
         SET operating_hours = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL`,
        [JSON.stringify(normalizedHours), businessUserId]
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
   * Change password for business user
   */
  async changePassword(businessUserId: string, currentPassword: string, newPassword: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current password hash
      const businessResult = await client.query(
        `SELECT password_hash FROM business_users WHERE id = $1 AND deleted_at IS NULL`,
        [businessUserId]
      );

      if (businessResult.rows.length === 0) {
        throw new NotFoundError('Business user not found');
      }

      // Verify current password
      const isValid = await authService.comparePassword(
        currentPassword,
        businessResult.rows[0].password_hash
      );

      if (!isValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await authService.hashPassword(newPassword);

      // Update password
      await client.query(
        `UPDATE business_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [newPasswordHash, businessUserId]
      );

      await client.query('COMMIT');

      logger.info('Password changed', { businessUserId });
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
  private formatBusiness(row: {
    id: string;
    business_name: string;
    owner_name: string | null;
    email: string;
    phone: string | null;
    business_type: string;
    address_street: string | null;
    address_city: string | null;
    address_state: string | null;
    address_country: string | null;
    address_lat: number | null;
    address_lng: number | null;
    website: string | null;
    description: string | null;
    logo: string | null;
    cover_image: string | null;
    gallery_images: string[] | null;
    daily_package_price: number | null;
    weekly_package_price: number | null;
    monthly_package_price: number | null;
    operating_hours: Record<string, unknown> | null;
    notification_preferences: Record<string, unknown> | null;
    security_settings: Record<string, unknown> | null;
    business_attributes: Record<string, unknown> | null;
    email_verified: boolean;
    phone_verified: boolean;
    business_verified: boolean;
    verification_status: string;
    account_status: string;
    subscription_tier: string | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
  }) {
    // Parse JSONB fields safely
    let operatingHours = {};
    if (row.operating_hours) {
      try {
        operatingHours = typeof row.operating_hours === 'string' 
          ? JSON.parse(row.operating_hours) 
          : row.operating_hours;
      } catch (e) {
        logger.warn('Failed to parse operating_hours', { error: e });
      }
    }

    let notificationPreferences = {
      emailBookings: true,
      emailPayments: true,
      emailReminders: true,
      smsBookings: false,
      smsPayments: true,
      pushNotifications: true,
    };
    if (row.notification_preferences) {
      try {
        notificationPreferences = typeof row.notification_preferences === 'string'
          ? JSON.parse(row.notification_preferences)
          : row.notification_preferences;
      } catch (e) {
        logger.warn('Failed to parse notification_preferences', { error: e });
      }
    }

    let securitySettings = {
      twoFactor: false,
      sessionTimeout: "30",
    };
    if (row.security_settings) {
      try {
        securitySettings = typeof row.security_settings === 'string'
          ? JSON.parse(row.security_settings)
          : row.security_settings;
      } catch (e) {
        logger.warn('Failed to parse security_settings', { error: e });
      }
    }

    let businessAttributes = {};
    if (row.business_attributes) {
      try {
        businessAttributes = typeof row.business_attributes === 'string'
          ? JSON.parse(row.business_attributes)
          : row.business_attributes;
      } catch (e) {
        logger.warn('Failed to parse business_attributes', { error: e });
      }
    }

    // Extract attributes for backward compatibility
    const attrs = businessAttributes as Record<string, unknown>;
    const amenities = attrs.amenities || [];
    const equipment = attrs.equipment || [];
    const classTypes = attrs.classTypes || [];
    const membershipOptions = attrs.membershipOptions || [];
    const subjects = attrs.subjects || [];
    const levels = attrs.levels || [];
    const teachingModes = attrs.teachingModes || [];
    const batchSizes = attrs.batchSizes || [];
    const facilities = attrs.facilities || [];
    const collections = attrs.collections || [];
    const spaceTypes = attrs.spaceTypes || [];

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
        lat: row.address_lat ? parseFloat(String(row.address_lat)) : null,
        lng: row.address_lng ? parseFloat(String(row.address_lng)) : null,
      },
      website: row.website,
      description: row.description || row.service_areas,
      serviceAreas: row.service_areas,
      subscriptionTier: row.subscription_tier,
      subscriptionStatus: row.subscription_status,
      emailVerified: row.email_verified,
      businessVerified: row.business_verified,
      verificationStatus: row.verification_status,
      accountStatus: row.account_status,
      isPublished: row.is_published || false,
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
      // Backward compatibility - expose attributes at top level
      amenities,
      equipment,
      classTypes,
      membershipOptions,
      subjects,
      levels,
      teachingModes,
      batchSizes,
      facilities,
      collections,
      spaceTypes,
      createdAt: row.created_at,
    };
  }
}

export const businessService = new BusinessService();
