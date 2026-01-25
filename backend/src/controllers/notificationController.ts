import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    accountType: string;
  };
}

/**
 * Get user notifications
 */
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const userType = req.user?.accountType === 'business_user' ? 'business' : 'normal';

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const filters = {
    read: req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await notificationService.getUserNotifications(userId, userType, filters);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const notification = await notificationService.markAsRead(id, userId);

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification,
  });
});

/**
 * Mark all as read
 */
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const userType = req.user?.accountType === 'business_user' ? 'business' : 'normal';

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  await notificationService.markAllAsRead(userId, userType);

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

/**
 * Delete notification
 */
export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  await notificationService.deleteNotification(id, userId);

  res.json({
    success: true,
    message: 'Notification deleted successfully',
  });
});
