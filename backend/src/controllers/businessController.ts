import { Request, Response } from 'express';
import { businessService } from '../services/businessService';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    accountType: string;
  };
}

/**
 * Get business profile
 */
export const getBusinessProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const business = await businessService.getBusinessProfile(businessUserId);

  res.json({
    success: true,
    data: business,
  });
});

/**
 * Update business profile
 */
export const updateBusinessProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const updateData = {
    businessName: req.body.businessName,
    ownerName: req.body.ownerName,
    phone: req.body.phone,
    website: req.body.website,
    address: req.body.address,
    specialties: req.body.specialties,
    serviceAreas: req.body.serviceAreas,
    dailyPackagePrice: req.body.dailyPackagePrice,
    weeklyPackagePrice: req.body.weeklyPackagePrice,
    monthlyPackagePrice: req.body.monthlyPackagePrice,
  };

  const business = await businessService.updateBusinessProfile(businessUserId, updateData);

  res.json({
    success: true,
    message: 'Business profile updated successfully',
    data: business,
  });
});

/**
 * Get business members
 */
export const getBusinessMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

  const result = await businessService.getBusinessMembers(businessUserId, page, limit);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Add business member
 */
export const addBusinessMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const { userId, notes } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: { message: 'User ID is required', code: 'VALIDATION_ERROR' },
    });
  }

  await businessService.addBusinessMember(businessUserId, userId, notes);

  res.status(201).json({
    success: true,
    message: 'Member added successfully',
  });
});

/**
 * Get business analytics
 */
export const getBusinessAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const period = (req.query.period as string) || 'month';

  const analytics = await businessService.getBusinessAnalytics(businessUserId, period);

  res.json({
    success: true,
    data: analytics,
  });
});

/**
 * Send announcement
 */
export const sendAnnouncement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const { title, message, memberIds } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      error: { message: 'Title and message are required', code: 'VALIDATION_ERROR' },
    });
  }

  await businessService.sendAnnouncement(businessUserId, title, message, memberIds);

  res.json({
    success: true,
    message: 'Announcement sent successfully',
  });
});
