import { pool } from '../db/pool';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

interface CreateReviewData {
  userId: string;
  venueId: string;
  bookingId?: string;
  rating: number;
  comment: string;
}

interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

class ReviewService {
  /**
   * Create review
   */
  async createReview(data: CreateReviewData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if user already reviewed this venue
      const existingReview = await client.query(
        `SELECT id FROM reviews WHERE user_id = $1 AND venue_id = $2 AND deleted_at IS NULL`,
        [data.userId, data.venueId]
      );

      if (existingReview.rows.length > 0) {
        throw new ValidationError('You have already reviewed this venue');
      }

      // Verify venue exists
      const venueResult = await client.query(
        `SELECT id FROM venues WHERE id = $1 AND deleted_at IS NULL`,
        [data.venueId]
      );

      if (venueResult.rows.length === 0) {
        throw new NotFoundError('Venue not found');
      }

      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      // Create review
      const result = await client.query(
        `INSERT INTO reviews (user_id, venue_id, booking_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.userId, data.venueId, data.bookingId || null, data.rating, data.comment]
      );

      // Rating update is handled by trigger

      // Create notification for business
      const businessResult = await client.query(
        `SELECT business_user_id FROM venues WHERE id = $1`,
        [data.venueId]
      );

      if (businessResult.rows.length > 0 && businessResult.rows[0].business_user_id) {
        const businessUserId = businessResult.rows[0].business_user_id;
        await client.query(
          `INSERT INTO notifications (
            user_id, user_type, type, title, message, related_entity, action_url,
            action_label, priority, delivery_channels
          ) VALUES ($1, 'business', 'review_alert', $2, $3, $4, $5, $6, 'medium', $7)`,
          [
            businessUserId,
            'New Review: ' + data.rating + ' Stars!',
            `A customer left a ${data.rating} star review. Respond now to engage.`,
            JSON.stringify({ reviewId: result.rows[0].id, customerId: data.userId }),
            `/business-dashboard/reviews`,
            'Respond',
            ['in_app', 'email'],
          ]
        );
      }

      await client.query('COMMIT');

      logger.info('Review created', { reviewId: result.rows[0].id, userId: data.userId });

      return this.formatReview(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update review
   */
  async updateReview(reviewId: string, userId: string, data: UpdateReviewData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get existing review
      const existing = await client.query(
        `SELECT * FROM reviews WHERE id = $1 AND deleted_at IS NULL`,
        [reviewId]
      );

      if (existing.rows.length === 0) {
        throw new NotFoundError('Review not found');
      }

      if (existing.rows[0].user_id !== userId) {
        throw new ForbiddenError('You can only update your own reviews');
      }

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (data.rating !== undefined) {
        if (data.rating < 1 || data.rating > 5) {
          throw new ValidationError('Rating must be between 1 and 5');
        }
        paramCount++;
        updates.push(`rating = $${paramCount}`);
        params.push(data.rating);
      }

      if (data.comment !== undefined) {
        paramCount++;
        updates.push(`comment = $${paramCount}`);
        params.push(data.comment);
      }

      if (updates.length === 0) {
        return this.formatReview(existing.rows[0]);
      }

      params.push(reviewId, userId);
      paramCount += 2;

      const result = await client.query(
        `UPDATE reviews
         SET ${updates.join(', ')}
         WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
         RETURNING *`,
        params
      );

      await client.query('COMMIT');

      return this.formatReview(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string, userId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await client.query(
        `SELECT * FROM reviews WHERE id = $1 AND deleted_at IS NULL`,
        [reviewId]
      );

      if (existing.rows.length === 0) {
        throw new NotFoundError('Review not found');
      }

      if (existing.rows[0].user_id !== userId) {
        throw new ForbiddenError('You can only delete your own reviews');
      }

      await client.query(
        `UPDATE reviews SET deleted_at = NOW() WHERE id = $1 AND user_id = $2`,
        [reviewId, userId]
      );

      await client.query('COMMIT');

      logger.info('Review deleted', { reviewId, userId });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add business reply to review
   */
  async addBusinessReply(reviewId: string, businessUserId: string, reply: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify review exists and belongs to business
      const reviewResult = await client.query(
        `SELECT r.*, v.business_user_id
         FROM reviews r
         JOIN venues v ON r.venue_id = v.id
         WHERE r.id = $1 AND r.deleted_at IS NULL`,
        [reviewId]
      );

      if (reviewResult.rows.length === 0) {
        throw new NotFoundError('Review not found');
      }

      if (reviewResult.rows[0].business_user_id !== businessUserId) {
        throw new ForbiddenError('You can only reply to reviews for your venues');
      }

      const result = await client.query(
        `UPDATE reviews
         SET business_reply = $1, business_reply_date = NOW()
         WHERE id = $2
         RETURNING *`,
        [reply, reviewId]
      );

      await client.query('COMMIT');

      return this.formatReview(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Format review for response
   */
  private formatReview(row: any) {
    return {
      id: row.id,
      userId: row.user_id,
      venueId: row.venue_id,
      bookingId: row.booking_id,
      rating: row.rating,
      comment: row.comment,
      helpfulCount: row.helpful_count || 0,
      businessReply: row.business_reply,
      businessReplyDate: row.business_reply_date,
      date: row.created_at,
      userName: row.user_name,
      userAvatar: row.user_avatar,
    };
  }
}

export const reviewService = new ReviewService();
