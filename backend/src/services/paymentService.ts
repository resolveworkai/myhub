import { pool } from '../db/pool';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';

interface CreatePaymentData {
  userId?: string;
  businessUserId: string;
  amount: number;
  type: 'membership' | 'session' | 'product' | 'other';
  paymentMethod?: string;
  dueDate?: string;
  notes?: string;
  memberName?: string;
  memberEmail?: string;
  memberPhone?: string;
}

class PaymentService {
  /**
   * Get business payments
   */
  async getBusinessPayments(businessUserId: string, filters: { status?: string; type?: string; page?: number; limit?: number } = {}) {
    const { status, type, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['v.business_user_id = $1'];
    const params: any[] = [businessUserId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      conditions.push(`p.payment_status = $${paramCount}`);
      params.push(status);
    }
    if (type) {
      paramCount++;
      conditions.push(`p.payment_type = $${paramCount}`);
      params.push(type);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN venues v ON b.venue_id = v.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get payments - include both booking payments and membership payments
    // Support standalone payments (user_id can be null)
    const result = await pool.query(
      `SELECT 
        p.*,
        COALESCE(u.name, p.member_name) as user_name,
        COALESCE(u.email, p.member_email) as user_email,
        v.name as venue_name,
        b.booking_date,
        b.booking_time,
        m.membership_type,
        m.start_date as membership_start,
        m.end_date as membership_end,
        CASE 
          WHEN p.booking_id IS NOT NULL THEN 'session'
          WHEN p.user_id IS NOT NULL AND EXISTS (SELECT 1 FROM memberships m2 WHERE m2.user_id = p.user_id AND m2.venue_id = p.venue_id) THEN 'membership'
          WHEN p.member_email IS NOT NULL THEN 'membership'
          ELSE 'other'
        END as payment_type
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN venues v ON COALESCE(b.venue_id, p.venue_id) = v.id
       LEFT JOIN memberships m ON p.user_id IS NOT NULL AND m.user_id = p.user_id AND m.venue_id = p.venue_id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE v.business_user_id = $1
       ${status ? `AND p.payment_status = $${paramCount}` : ''}
       ORDER BY p.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    return {
      payments: result.rows.map(this.formatPayment),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create payment record
   */
  async createPayment(data: CreatePaymentData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get user by email if provided, or use userId
      // For standalone payments, userId can be null
      let userId: string | null = null;
      let memberName: string | null = null;
      let memberEmail: string | null = null;
      let memberPhone: string | null = null;

      // Accept explicit member data passed in (controller forwards memberName/memberEmail/memberPhone)
      if (data.memberName) memberName = data.memberName;
      if (data.memberEmail) memberEmail = data.memberEmail.toLowerCase();
      if (data.memberPhone) memberPhone = data.memberPhone;
      
      if (data.userId && data.userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Valid UUID - use as userId
        userId = data.userId;
      } else if (data.userId) {
        // If userId is actually an email, try to find user
        const userResult = await client.query(
          `SELECT id, name FROM users WHERE email = $1 AND deleted_at IS NULL`,
          [data.userId.toLowerCase()]
        );
        if (userResult.rows.length > 0) {
          userId = userResult.rows[0].id;
          memberName = memberName || userResult.rows[0].name;
          memberEmail = memberEmail || data.userId.toLowerCase();
        } else {
          // User doesn't exist - create standalone payment
          memberEmail = memberEmail || data.userId.toLowerCase();
          memberName = memberName || data.userId.split('@')[0]; // Use email prefix as name
        }
      }
      
      // If no userId and no email provided, this is invalid
      if (!userId && !memberEmail) {
        throw new ValidationError('Either userId or userEmail must be provided');
      }

      // Get business venue
      const venueResult = await client.query(
        `SELECT id FROM venues WHERE business_user_id = $1 AND deleted_at IS NULL LIMIT 1`,
        [data.businessUserId]
      );

      if (venueResult.rows.length === 0) {
        throw new NotFoundError('No venue found for this business');
      }

      const venueId = venueResult.rows[0].id;

      // Create payment record (user_id can be null for standalone payments)
      // Try to resolve a standalone business member if memberEmail provided
      let businessMemberId: string | null = null;
      if (memberEmail) {
        const bmsResult = await client.query(
          `SELECT id FROM business_members_standalone WHERE email = $1 AND business_user_id = $2 AND deleted_at IS NULL LIMIT 1`,
          [memberEmail, data.businessUserId]
        );
        if (bmsResult.rows.length > 0) {
          businessMemberId = bmsResult.rows[0].id;
        }
      }

      const result = await client.query(
        `INSERT INTO payments (
          user_id, venue_id, amount, currency, payment_method, payment_status,
          member_name, member_email, member_phone, business_member_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          userId,
          venueId,
          data.amount,
          'INR',
          data.paymentMethod || 'cash',
          'pending',
          memberName,
          memberEmail,
          memberPhone,
          businessMemberId,
        ]
      );

      await client.query('COMMIT');

      logger.info('Payment record created', { paymentId: result.rows[0].id, businessUserId: data.businessUserId });

      return this.formatPayment(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId: string, businessUserId: string, status: string, paymentMethod?: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify payment belongs to business
      const paymentResult = await client.query(
        `SELECT p.* FROM payments p
         LEFT JOIN bookings b ON p.booking_id = b.id
         LEFT JOIN venues v ON COALESCE(b.venue_id, p.venue_id) = v.id
         WHERE p.id = $1 AND v.business_user_id = $2`,
        [paymentId, businessUserId]
      );

      if (paymentResult.rows.length === 0) {
        throw new NotFoundError('Payment not found or does not belong to this business');
      }

      const updates: string[] = ['payment_status = $1'];
      const params: any[] = [status];
      let paramCount = 1;

      if (paymentMethod) {
        paramCount++;
        updates.push(`payment_method = $${paramCount}`);
        params.push(paymentMethod);
      }

      if (status === 'completed') {
        updates.push('completed_at = NOW()');
      }

      paramCount++;
      params.push(paymentId);

      await client.query(
        `UPDATE payments SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
        params
      );

      await client.query('COMMIT');

      logger.info('Payment status updated', { paymentId, status, businessUserId });

      return await this.getPaymentById(paymentId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string) {
    const result = await pool.query(
      `SELECT p.*, u.name as user_name, u.email as user_email, v.name as venue_name
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN venues v ON p.venue_id = v.id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Payment not found');
    }

    return this.formatPayment(result.rows[0]);
  }

  /**
   * Get business payment stats
   */
  async getBusinessPaymentStats(businessUserId: string) {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN p.payment_status = 'completed' AND p.booking_id IS NOT NULL THEN p.amount END),0) AS booking_revenue,
        COALESCE(SUM(CASE WHEN p.payment_status = 'completed' AND EXISTS (SELECT 1 FROM memberships m WHERE m.payment_id = p.id AND m.business_user_id = $1) THEN p.amount END),0) AS membership_revenue,
        COALESCE(SUM(CASE WHEN p.payment_status = 'completed' AND p.business_member_id IS NOT NULL THEN p.amount END),0) AS standalone_member_revenue,

        -- Total is explicitly the sum of the three components to ensure consistency
        (
          COALESCE(SUM(CASE WHEN p.payment_status = 'completed' AND p.booking_id IS NOT NULL THEN p.amount END),0)
          + COALESCE(SUM(CASE WHEN p.payment_status = 'completed' AND EXISTS (SELECT 1 FROM memberships m WHERE m.payment_id = p.id AND m.business_user_id = $1) THEN p.amount END),0)
          + COALESCE(SUM(CASE WHEN p.payment_status = 'completed' AND p.business_member_id IS NOT NULL THEN p.amount END),0)
        ) AS total_revenue,

        COALESCE(SUM(CASE WHEN p.payment_status = 'pending' THEN p.amount END),0) AS pending_amount,
        COUNT(*) FILTER (WHERE p.payment_status = 'completed') as paid_count,
        COUNT(*) FILTER (WHERE p.payment_status = 'pending' AND p.created_at < NOW() - INTERVAL '7 days') as overdue_count
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN venues v ON COALESCE(b.venue_id, p.venue_id) = v.id
       WHERE v.business_user_id = $1
       AND p.created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
      [businessUserId]
    );

    const stats = result.rows[0];
    return {
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      pendingDues: parseFloat(stats.pending_amount) || 0,
      paidThisMonth: parseInt(stats.paid_count) || 0,
      overdue: parseInt(stats.overdue_count) || 0,
    };
  }

  /**
   * Format payment for response
   */
  private formatPayment(row: {
    id: string;
    user_id: string | null;
    member_name: string | null;
    member_email: string | null;
    member_phone: string | null;
    user_name: string | null;
    user_email: string | null;
    booking_id: string | null;
    membership_type: string | null;
    payment_status: string;
    amount: string | number;
    created_at: string;
    due_date: string | null;
    payment_method: string;
    venue_name: string | null;
    booking_date: string | null;
    booking_time: string | null;
  }) {
    // Determine payment type
    let paymentType = 'other';
    if (row.booking_id) {
      paymentType = 'session';
    } else if (row.membership_type || row.member_email) {
      paymentType = 'membership';
    }

    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name || row.member_name || 'Guest',
      userEmail: row.user_email || row.member_email || null,
      amount: parseFloat(String(row.amount)) || 0,
      type: paymentType,
      status: row.payment_status === 'completed' ? 'paid' : row.payment_status === 'failed' ? 'overdue' : row.payment_status,
      date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: row.due_date || undefined,
      method: row.payment_method,
      venueName: row.venue_name,
      bookingDate: row.booking_date,
      bookingTime: row.booking_time,
      membershipType: row.membership_type,
    };
  }
}

export const paymentService = new PaymentService();
