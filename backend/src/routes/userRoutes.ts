import { Router } from 'express';
import {
  getCurrentUser,
  updateUserProfile,
  getUserFavorites,
  addFavorite,
  removeFavorite,
  getUserPayments,
  getUserDashboard,
  changePassword,
} from '../controllers/userController';
import { authenticate, requireUser } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  updateUserProfileSchema,
  changePasswordSchema,
} from '../validators/userValidators';

const router = Router();

// All user routes require authentication
router.use(authenticate);
router.use(requireUser);

// Profile routes
router.get('/me', getCurrentUser);
router.patch('/me', validate(updateUserProfileSchema), updateUserProfile);

// Favorites routes
router.get('/me/favorites', getUserFavorites);
router.post('/me/favorites/:venueId', addFavorite);
router.delete('/me/favorites/:venueId', removeFavorite);

// Bookings route (delegated to booking routes)
// Payments route
router.get('/me/payments', getUserPayments);

// Dashboard route
router.get('/me/dashboard', getUserDashboard);

// Password change
router.post('/me/change-password', validate(changePasswordSchema), changePassword);

export default router;
