import { Router } from 'express';
import {
  adminLogin,
  getDashboardStats,
  getBusinesses,
  verifyBusiness,
  suspendBusiness,
  deleteBusiness,
  getUsers,
  getUserDetails,
  suspendUser,
  getPassConfigurations,
  createPassConfiguration,
  updatePassConfiguration,
  deletePassConfiguration,
  getAnalytics,
  getPlatformSettings,
  updatePlatformSetting,
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  adminLoginSchema,
  suspendBusinessSchema,
  suspendUserSchema,
  createPassConfigurationSchema,
  updatePassConfigurationSchema,
  updatePlatformSettingSchema,
} from '../validators/adminValidators';

const router = Router();

// Public admin login route
router.post('/auth/login', validate(adminLoginSchema), adminLogin);

// All other routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Business management
router.get('/businesses', getBusinesses);
router.post('/businesses/:id/verify', verifyBusiness);
router.post('/businesses/:id/suspend', validate(suspendBusinessSchema), suspendBusiness);
router.delete('/businesses/:id', deleteBusiness);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.post('/users/:id/suspend', validate(suspendUserSchema), suspendUser);

// Pass configuration
router.get('/passes', getPassConfigurations);
router.post('/passes', validate(createPassConfigurationSchema), createPassConfiguration);
router.patch('/passes/:id', validate(updatePassConfigurationSchema), updatePassConfiguration);
router.delete('/passes/:id', deletePassConfiguration);

// Analytics
router.get('/analytics', getAnalytics);

// Platform settings
router.get('/settings', getPlatformSettings);
router.patch('/settings/:key', validate(updatePlatformSettingSchema), updatePlatformSetting);

export default router;
