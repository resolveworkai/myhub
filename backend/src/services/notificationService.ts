import { pool } from '../db/pool';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';

class NotificationService {
  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    userType: 'normal' | 'business',
    filters: { read?: boolean; page?: number; limit?: number } = {}
  ) {
    const { read, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['user_id = $1', 'user_type = $2'];
    const params: any[] = [userId, userType];
    let paramCount = 2;

    if (read !== undefined) {
      paramCount++;
      conditions.push(`read = $${paramCount}`);
      params.push(read);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get notifications
    const result = await pool.query(
      `SELECT * FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    return {
      notifications: result.rows.map(this.formatNotification),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount: read === undefined
        ? await this.getUnreadCount(userId, userType)
        : undefined,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const result = await pool.query(
      `UPDATE notifications
       SET read = TRUE, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Notification not found');
    }

    return this.formatNotification(result.rows[0]);
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string, userType: 'normal' | 'business') {
    await pool.query(
      `UPDATE notifications
       SET read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND user_type = $2 AND read = FALSE`,
      [userId, userType]
    );

    logger.info('All notifications marked as read', { userId });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Notification not found');
    }

    logger.info('Notification deleted', { notificationId, userId });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string, userType: 'normal' | 'business'): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = $1 AND user_type = $2 AND read = FALSE`,
      [userId, userType]
    );

    return parseInt(result.rows[0].count) || 0;
  }

  /**
   * Format notification for response
   */
  private formatNotification(row: any) {
    let relatedEntity = {};
    let deliveryStatus = {};
    
    try {
      relatedEntity = row.related_entity && typeof row.related_entity === 'string' 
        ? JSON.parse(row.related_entity) 
        : row.related_entity || {};
    } catch {
      relatedEntity = {};
    }
    
    try {
      deliveryStatus = row.delivery_status && typeof row.delivery_status === 'string'
        ? JSON.parse(row.delivery_status)
        : row.delivery_status || {};
    } catch {
      deliveryStatus = {};
    }
    
    return {
      id: row.id,
      userId: row.user_id,
      userType: row.user_type,
      type: row.type,
      title: row.title,
      message: row.message,
      relatedEntity,
      actionUrl: row.action_url,
      actionLabel: row.action_label,
      priority: row.priority,
      read: row.read,
      deliveryChannels: row.delivery_channels || [],
      deliveryStatus,
      createdAt: row.created_at,
      readAt: row.read_at,
    };
  }
}

export const notificationService = new NotificationService();
