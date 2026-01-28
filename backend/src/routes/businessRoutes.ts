import { Router } from 'express';
import {
  getBusinessProfile,
  updateBusinessProfile,
  getBusinessMembers,
  addBusinessMember,
  getBusinessAnalytics,
  sendAnnouncement,
  cancelMembership,
  getDashboardStats,
  updateBusinessInfo,
  updateLocationAndMedia,
  updateBusinessAttributes,
  updatePricing,
  updateOperatingHours,
  updateNotificationPreferences,
  updateSecuritySettings,
  togglePublishStatus,
  changePassword,
  getBusinessVenueId,
} from '../controllers/businessController';
import { authenticate, requireBusiness } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  updateBusinessProfileSchema,
  addBusinessMemberSchema,
  sendAnnouncementSchema,
  cancelMembershipSchema,
  updateBusinessInfoSchema,
  updateLocationAndMediaSchema,
  updateBusinessAttributesSchema,
  updatePricingSchema,
  updateOperatingHoursSchema,
  updateNotificationPreferencesSchema,
  updateSecuritySettingsSchema,
  togglePublishSchema,
} from '../validators/businessValidators';

const router = Router();

// All business routes require authentication and business account
router.use(authenticate);
router.use(requireBusiness);

// Profile routes
router.get('/me', getBusinessProfile);
router.patch('/me', validate(updateBusinessProfileSchema), updateBusinessProfile);

// Dashboard route
router.get('/dashboard/stats', getDashboardStats);

// Settings routes
router.patch('/settings/business-info', validate(updateBusinessInfoSchema), updateBusinessInfo);
router.patch('/settings/location-media', validate(updateLocationAndMediaSchema), updateLocationAndMedia);
router.patch('/settings/attributes', validate(updateBusinessAttributesSchema), updateBusinessAttributes);
router.patch('/settings/pricing', validate(updatePricingSchema), updatePricing);
router.patch('/settings/operating-hours', validate(updateOperatingHoursSchema), updateOperatingHours);
router.patch('/settings/notifications', validate(updateNotificationPreferencesSchema), updateNotificationPreferences);
router.patch('/settings/security', validate(updateSecuritySettingsSchema), updateSecuritySettings);
router.patch('/settings/publish', validate(togglePublishSchema), togglePublishStatus);

// Members routes
router.get('/members', getBusinessMembers);
router.post('/members', validate(addBusinessMemberSchema), addBusinessMember);
router.delete('/memberships/:id', validate(cancelMembershipSchema), cancelMembership);

// Analytics route
router.get('/analytics', getBusinessAnalytics);

// Announcements route
router.post('/announcements', validate(sendAnnouncementSchema), sendAnnouncement);

// Password change
router.post('/change-password', changePassword);

// Get business venue ID
router.get('/venue-id', getBusinessVenueId);

export default router;
