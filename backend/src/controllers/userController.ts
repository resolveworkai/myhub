import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    accountType: string;
  };
}

/**
 * Get current user profile
 */
export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const user = await userService.getUserProfile(userId);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Update user profile
 */
export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const updateData = {
    name: req.body.name,
    phone: req.body.phone,
    location: req.body.location,
    preferences: req.body.preferences,
    marketingConsent: req.body.marketingConsent,
    avatar: req.body.avatar,
  };

  const user = await userService.updateUserProfile(userId, updateData);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

/**
 * Get user favorites
 */
export const getUserFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const favorites = await userService.getUserFavorites(userId);

  res.json({
    success: true,
    data: favorites,
  });
});

/**
 * Add favorite
 */
export const addFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { venueId } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  await userService.addFavorite(userId, venueId);

  res.json({
    success: true,
    message: 'Favorite added successfully',
  });
});

/**
 * Remove favorite
 */
export const removeFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { venueId } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  await userService.removeFavorite(userId, venueId);

  res.json({
    success: true,
    message: 'Favorite removed successfully',
  });
});

/**
 * Get user payments
 */
export const getUserPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

  const result = await userService.getUserPayments(userId, page, limit);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get user dashboard data
 */
export const getUserDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const dashboardData = await userService.getUserDashboard(userId);

  res.json({
    success: true,
    data: dashboardData,
  });
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: { message: 'Current password and new password are required', code: 'VALIDATION_ERROR' },
    });
  }

  await userService.changePassword(userId, currentPassword, newPassword);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});
