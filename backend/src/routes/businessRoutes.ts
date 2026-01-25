import { Router } from 'express';
import {
  getBusinessProfile,
  updateBusinessProfile,
  getBusinessMembers,
  addBusinessMember,
  getBusinessAnalytics,
  sendAnnouncement,
} from '../controllers/businessController';
import { authenticate, requireBusiness } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  updateBusinessProfileSchema,
  addBusinessMemberSchema,
  sendAnnouncementSchema,
} from '../validators/businessValidators';

const router = Router();

// All business routes require authentication and business account
router.use(authenticate);
router.use(requireBusiness);

// Profile routes
router.get('/me', getBusinessProfile);
router.patch('/me', validate(updateBusinessProfileSchema), updateBusinessProfile);

// Members routes
router.get('/members', getBusinessMembers);
router.post('/members', validate(addBusinessMemberSchema), addBusinessMember);

// Analytics route
router.get('/analytics', getBusinessAnalytics);

// Announcements route
router.post('/announcements', validate(sendAnnouncementSchema), sendAnnouncement);

export default router;
