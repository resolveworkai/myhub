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

  const { userName, userEmail, userPhone, membershipType, price, notes } = req.body;

  const result = await businessService.addBusinessMember(businessUserId, {
    userName,
    userEmail,
    userPhone,
    membershipType,
    price,
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Member added successfully',
    data: result,
  });
});

/**
 * Cancel membership
 */
export const cancelMembership = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const { id } = req.params;

  await businessService.cancelMembership(id, businessUserId);

  res.json({
    success: true,
    message: 'Membership cancelled successfully',
  });
});

/**
 * Get dashboard stats
 */
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const stats = await businessService.getDashboardStats(businessUserId);

  res.json({
    success: true,
    data: stats,
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

/**
 * Update business information
 */
export const updateBusinessInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const business = await businessService.updateBusinessInfo(businessUserId, req.body);

  res.json({
    success: true,
    message: 'Business information updated successfully',
    data: business,
  });
});

/**
 * Update location and media
 */
export const updateLocationAndMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const business = await businessService.updateLocationAndMedia(businessUserId, req.body);

  res.json({
    success: true,
    message: 'Location and media updated successfully',
    data: business,
  });
});

/**
 * Update business attributes
 */
export const updateBusinessAttributes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const business = await businessService.updateBusinessAttributes(businessUserId, req.body);

  res.json({
    success: true,
    message: 'Business attributes updated successfully',
    data: business,
  });
});

/**
 * Update pricing packages
 */
export const updatePricing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const business = await businessService.updatePricing(businessUserId, req.body);

  res.json({
    success: true,
    message: 'Pricing updated successfully',
    data: business,
  });
});

/**
 * Update operating hours
 */
export const updateOperatingHours = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const business = await businessService.updateOperatingHours(businessUserId, req.body);

  res.json({
    success: true,
    message: 'Operating hours updated successfully',
    data: business,
  });
});

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const business = await businessService.updateNotificationPreferences(businessUserId, req.body);

  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: business,
  });
});

/**
 * Update security settings
 */
export const updateSecuritySettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const business = await businessService.updateSecuritySettings(businessUserId, req.body);

  res.json({
    success: true,
    message: 'Security settings updated successfully',
    data: business,
  });
});

/**
 * Toggle publish status
 */
export const togglePublishStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const { isPublished } = req.body;

  const business = await businessService.togglePublishStatus(businessUserId, isPublished);

  res.json({
    success: true,
    message: isPublished ? 'Business published successfully' : 'Business unpublished successfully',
    data: business,
  });
});