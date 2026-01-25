import { Router } from 'express';
import {
  listVenues,
  getVenueById,
  getVenueSchedule,
  getVenueReviews,
  checkAvailability,
} from '../controllers/venueController';
import { optionalAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { listVenuesSchema, checkAvailabilitySchema } from '../validators/venueValidators';

const router = Router();

// Public routes
router.get('/', optionalAuth, validateQuery(listVenuesSchema), listVenues);
router.get('/:id', optionalAuth, getVenueById);
router.get('/:id/schedule', optionalAuth, getVenueSchedule);
router.get('/:id/reviews', optionalAuth, getVenueReviews);
router.get('/:id/availability', optionalAuth, validateQuery(checkAvailabilitySchema), checkAvailability);

export default router;
