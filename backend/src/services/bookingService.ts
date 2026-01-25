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
        `INSERT INTO notifications (
          user_id, user_type, type, title, message, related_entity, action_url,
          action_label, priority, delivery_channels
        ) VALUES ($1, 'normal', 'booking_confirmation', $2, $3, $4, $5, $6, 'high', $7)`,
        [
          data.userId,
          'Booking Confirmed!',
          `Your booking at ${venue.name} for ${data.date} at ${data.time} has been confirmed.`,
          JSON.stringify({ bookingId: booking.id, venueId: data.venueId }),
          `/dashboard/appointments`,
          'View Booking',
          ['in_app', 'email'],
        ]
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
    const params: any[] = [userId];
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
       LEFT JOIN venues v ON b.venue_id = v.id
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
    const result = await pool.query(
      `SELECT b.*, v.name as venue_name, v.image as venue_image, v.category as venue_category
       FROM bookings b
       LEFT JOIN venues v ON b.venue_id = v.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Booking not found');
    }

    const booking = result.rows[0];

    // Check ownership if userId provided
    if (userId && booking.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to access this booking');
    }

    return this.formatBooking(booking);
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
      const params: any[] = [];
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
         SET ${updates.join(', ')}
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
      const result = await client.query(
        `UPDATE bookings
         SET status = 'cancelled', cancelled_at = NOW(), cancelled_reason = $1
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [reason || null, bookingId, userId]
      );

      // Update schedule
      await client.query(
        `UPDATE schedules
         SET booked_slots = GREATEST(0, booked_slots - $1)
         WHERE venue_id = $2 AND date = $3 AND time_slot = $4`,
        [booking.attendees, booking.venue_id, booking.booking_date, booking.booking_time]
      );

      await client.query('COMMIT');

      logger.info('Booking cancelled', { bookingId, userId });

      return this.formatBooking(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get business bookings
   */
  async getBusinessBookings(businessUserId: string, filters: any = {}) {
    const { status, date, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['v.business_user_id = $1'];
    const params: any[] = [businessUserId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      conditions.push(`b.status = $${paramCount}`);
      params.push(status);
    }
    if (date) {
      paramCount++;
      conditions.push(`b.booking_date = $${paramCount}`);
      params.push(date);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get bookings
    const result = await pool.query(
      `SELECT b.*, v.name as venue_name, u.name as user_name, u.email as user_email
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       LEFT JOIN users u ON b.user_id = u.id
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
   * Format booking for response
   */
  private formatBooking(row: any) {
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
