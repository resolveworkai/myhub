import { pool } from '../db/pool';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { venueService } from './venueService';

interface CreateBookingData {
  userId: string;
  venueId: string;
  date: string;
  time: string;
  duration: number;
  attendees: number;
  specialRequests?: string;
  bookingType?: 'one_time' | 'monthly' | 'membership';
}

interface UpdateBookingData {
  date?: string;
  time?: string;
  duration?: number;
  attendees?: number;
  specialRequests?: string;
  status?: string;
}

class BookingService {
  /**
   * Create booking
   */
  async createBooking(data: CreateBookingData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify venue exists
      const venue = await venueService.getVenueById(data.venueId);

      // Check availability
      const availability = await venueService.checkAvailability(
        data.venueId,
        data.date,
        data.time
      );

      if (!availability.available || availability.availableSlots < data.attendees) {
        throw new ValidationError(
          `Not enough available slots. Only ${availability.availableSlots} slots available.`
        );
      }

      // Calculate price (simplified - can be enhanced)
      const pricePerHour = venue.price / 30; // Assuming monthly price
      const hours = data.duration / 60;
      const totalPrice = pricePerHour * hours * data.attendees;

      // Create booking
      const result = await client.query(
        `INSERT INTO bookings (
          user_id, venue_id, venue_type, booking_date, booking_time, duration,
          status, total_price, attendees, special_requests
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          data.userId,
          data.venueId,
          venue.category,
          data.date,
          data.time,
          data.duration,
          'confirmed',
          totalPrice,
          data.attendees,
          data.specialRequests || null,
        ]
      );

      const booking = result.rows[0];

      // Update schedule if exists
      await client.query(
        `INSERT INTO schedules (venue_id, date, time_slot, total_slots, booked_slots)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (venue_id, date, time_slot) 
         DO UPDATE SET booked_slots = schedules.booked_slots + $5`,
        [data.venueId, data.date, data.time, venue.capacity, data.attendees]
      );

      // Create notification
      await client.query(
        `INSERT INTO notifications (user_id, user_type, type, title, message, related_entity)
         VALUES ($1, 'normal', 'booking_confirmed', 'Booking Confirmed', 
         'Your booking at ${venue.name} has been confirmed', 
         jsonb_build_object('bookingId', $2, 'venueId', $3))`,
        [data.userId, booking.id, data.venueId]
      );

      await client.query('COMMIT');

      logger.info('Booking created', { bookingId: booking.id, userId: data.userId });

      return this.formatBooking(booking);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user bookings
   */
  async getUserBookings(userId: string, filters: { status?: string; page?: number; limit?: number } = {}) {
    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['b.user_id = $1'];
    const params: (string | number | undefined)[] = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      conditions.push(`b.status = $${paramCount}`);
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM bookings b ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get bookings
    const result = await pool.query(
      `SELECT b.*, v.name as venue_name, v.image as venue_image, v.category as venue_category
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       ${whereClause}
       ORDER BY b.booking_date DESC, b.booking_time DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    return {
      bookings: result.rows.map(this.formatBooking),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string, userId?: string) {
    const query = userId
      ? `SELECT b.*, v.name as venue_name, v.image as venue_image, v.category as venue_category
         FROM bookings b
         JOIN venues v ON b.venue_id = v.id
         WHERE b.id = $1 AND b.user_id = $2`
      : `SELECT b.*, v.name as venue_name, v.image as venue_image, v.category as venue_category
         FROM bookings b
         JOIN venues v ON b.venue_id = v.id
         WHERE b.id = $1`;

    const params = userId ? [bookingId, userId] : [bookingId];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      throw new NotFoundError('Booking not found');
    }

    return this.formatBooking(result.rows[0]);
  }

  /**
   * Update booking
   */
  async updateBooking(bookingId: string, userId: string, data: UpdateBookingData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get existing booking
      const existing = await this.getBookingById(bookingId, userId);

      if (existing.status === 'cancelled' || existing.status === 'completed') {
        throw new ValidationError('Cannot update a cancelled or completed booking');
      }

      // Build update query
      const updates: string[] = [];
      const params: (string | number | undefined)[] = [];
      let paramCount = 1;

      if (data.date !== undefined) {
        paramCount++;
        updates.push(`booking_date = $${paramCount}`);
        params.push(data.date);
      }
      if (data.time !== undefined) {
        paramCount++;
        updates.push(`booking_time = $${paramCount}`);
        params.push(data.time);
      }
      if (data.duration !== undefined) {
        paramCount++;
        updates.push(`duration = $${paramCount}`);
        params.push(data.duration);
      }
      if (data.attendees !== undefined) {
        paramCount++;
        updates.push(`attendees = $${paramCount}`);
        params.push(data.attendees);
      }
      if (data.specialRequests !== undefined) {
        paramCount++;
        updates.push(`special_requests = $${paramCount}`);
        params.push(data.specialRequests);
      }
      if (data.status !== undefined) {
        paramCount++;
        updates.push(`status = $${paramCount}`);
        params.push(data.status);
      }

      if (updates.length === 0) {
        return existing;
      }

      params.push(bookingId, userId);
      paramCount += 2;

      const result = await client.query(
        `UPDATE bookings
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
         RETURNING *`,
        params
      );

      await client.query('COMMIT');

      return this.formatBooking(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, userId: string, reason?: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const booking = await this.getBookingById(bookingId, userId);

      if (booking.status === 'cancelled') {
        throw new ValidationError('Booking is already cancelled');
      }

      if (booking.status === 'completed') {
        throw new ValidationError('Cannot cancel a completed booking');
      }

      // Update booking status
      await client.query(
        `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancelled_reason = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3`,
        [reason || null, bookingId, userId]
      );

      await client.query('COMMIT');

      logger.info('Booking cancelled', { bookingId, userId });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get business bookings (from business_appointments_standalone table)
   */
  async getBusinessBookings(businessUserId: string, filters: { status?: string; date?: string; page?: number; limit?: number } = {}) {
    const { status, date, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['a.business_user_id = $1', 'a.deleted_at IS NULL'];
    const params: (string | number | undefined)[] = [businessUserId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      conditions.push(`a.status = $${paramCount}`);
      params.push(status);
    }
    if (date) {
      paramCount++;
      conditions.push(`a.appointment_date = $${paramCount}`);
      params.push(date);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM business_appointments_standalone a
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get appointments
    const result = await pool.query(
      `SELECT 
        a.*, 
        v.name as venue_name,
        v.category as venue_type
       FROM business_appointments_standalone a
       LEFT JOIN venues v ON a.venue_id = v.id
       ${whereClause}
       ORDER BY a.appointment_date DESC, a.appointment_time DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    return {
      bookings: result.rows.map((row) => this.formatBusinessAppointment(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update booking status (for business users)
   * Works with business_appointments_standalone table
   */
  async updateBookingStatus(bookingId: string, businessUserId: string, status: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify appointment belongs to business
      const appointmentResult = await client.query(
        `SELECT * FROM business_appointments_standalone
         WHERE id = $1 AND business_user_id = $2 AND deleted_at IS NULL`,
        [bookingId, businessUserId]
      );

      if (appointmentResult.rows.length === 0) {
        throw new NotFoundError('Appointment not found or does not belong to this business');
      }

      const appointment = appointmentResult.rows[0];

      if (appointment.status === 'cancelled' && status !== 'cancelled') {
        throw new ValidationError('Cannot change status of a cancelled appointment');
      }

      // Update status
      const updateData: { status: string; cancelled_at?: string; updated_at: string } = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const result = await client.query(
        `UPDATE business_appointments_standalone 
         SET status = $1, cancelled_at = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, updateData.cancelled_at || null, bookingId]
      );

      await client.query('COMMIT');

      logger.info('Appointment status updated', { appointmentId: bookingId, status, businessUserId });

      return this.formatBusinessAppointment(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create booking for business (walk-in/appointment)
   * Uses business_appointments_standalone table instead of bookings table
   */
  async createBusinessBooking(
    businessUserId: string,
    data: {
      userName: string;
      userEmail?: string;
      userPhone?: string;
      venueId: string;
      date: string;
      time: string;
      duration: number;
      attendees?: number;
      specialRequests?: string;
    }
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify venue belongs to business
      const venueResult = await client.query(
        `SELECT v.* FROM venues v
         WHERE v.id = $1 AND v.business_user_id = $2 AND v.deleted_at IS NULL`,
        [data.venueId, businessUserId]
      );

      if (venueResult.rows.length === 0) {
        throw new NotFoundError('Venue not found or does not belong to this business');
      }

      const venue = venueResult.rows[0];

      // Check if member exists in business_members_standalone
      let memberId: string | null = null;
      if (data.userEmail) {
        const memberResult = await client.query(
          `SELECT id FROM business_members_standalone 
           WHERE business_user_id = $1 AND email = $2 AND deleted_at IS NULL 
           LIMIT 1`,
          [businessUserId, data.userEmail.toLowerCase()]
        );
        if (memberResult.rows.length > 0) {
          memberId = memberResult.rows[0].id;
        }
      }

      // If member doesn't exist, create one in business_members_standalone
      if (!memberId) {
        const memberResult = await client.query(
          `INSERT INTO business_members_standalone (
            business_user_id, venue_id, name, email, phone, 
            membership_type, price, start_date, end_date, status, notes
          )
           VALUES ($1, $2, $3, $4, $5, 'daily', 0, CURRENT_DATE, CURRENT_DATE, 'active', $6)
           RETURNING id`,
          [
            businessUserId,
            data.venueId,
            data.userName,
            data.userEmail || null,
            data.userPhone || null,
            `Created from appointment on ${data.date}`,
          ]
        );
        memberId = memberResult.rows[0].id;
        logger.info('Created member from appointment', { memberId, businessUserId });
      }

      // Create appointment in business_appointments_standalone table
      const appointmentResult = await client.query(
        `INSERT INTO business_appointments_standalone (
          business_user_id, venue_id, member_id, name, email, phone,
          appointment_date, appointment_time, duration, attendees,
          status, special_requests, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          businessUserId,
          data.venueId,
          memberId,
          data.userName,
          data.userEmail || null,
          data.userPhone || null,
          data.date,
          data.time,
          data.duration,
          data.attendees || 1,
          'pending',
          data.specialRequests || null,
          null, // notes field
        ]
      );

      const appointment = appointmentResult.rows[0];

      await client.query('COMMIT');

      logger.info('Business appointment created', { appointmentId: appointment.id, businessUserId, memberId });

      return this.formatBusinessAppointment(appointment);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Format business appointment for API response
   */
  private formatBusinessAppointment(row: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    appointment_date: string;
    appointment_time: string;
    duration: number;
    attendees: number;
    status: string;
    special_requests: string | null;
    venue_id: string;
    member_id: string | null;
    created_at: string;
    updated_at: string;
    venue_name?: string | null;
    venue_type?: string | null;
  }) {
    return {
      id: row.id,
      userName: row.name,
      userEmail: row.email,
      userPhone: row.phone,
      date: row.appointment_date,
      bookingDate: row.appointment_date,
      time: row.appointment_time,
      bookingTime: row.appointment_time,
      duration: row.duration,
      attendees: row.attendees,
      status: row.status,
      specialRequests: row.special_requests,
      venueId: row.venue_id,
      venueName: row.venue_name || null,
      venueType: row.venue_type || null,
      memberId: row.member_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Format booking for response
   */
  private formatBooking(row: {
    id: string;
    user_id: string;
    venue_id: string;
    venue_type: string;
    booking_date: string;
    booking_time: string;
    duration: number;
    status: string;
    total_price: string | number;
    attendees: number;
    special_requests: string | null;
    created_at: string;
    venue_name?: string;
    venue_image?: string;
    venue_category?: string;
    user_name?: string;
    user_email?: string;
    cancelled_at?: string | null;
    cancelled_reason?: string | null;
  }) {
    return {
      id: row.id,
      userId: row.user_id,
      venueId: row.venue_id,
      venueType: row.venue_type,
      date: row.booking_date,
      time: row.booking_time,
      duration: row.duration,
      status: row.status,
      totalPrice: parseFloat(row.total_price) || 0,
      attendees: row.attendees,
      specialRequests: row.special_requests,
      bookingDate: row.created_at,
      venueName: row.venue_name,
      venueImage: row.venue_image,
      venueCategory: row.venue_category,
      userName: row.user_name,
      userEmail: row.user_email,
      cancelledAt: row.cancelled_at,
      cancelledReason: row.cancelled_reason,
    };
  }
}

export const bookingService = new BookingService();
