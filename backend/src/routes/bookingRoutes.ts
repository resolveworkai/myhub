import { Router } from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getBusinessBookings,
} from '../controllers/bookingController';
import { authenticate, requireBusiness } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
} from '../validators/bookingValidators';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// User routes
router.get('/', getUserBookings);
router.post('/', validate(createBookingSchema), createBooking);
router.get('/:id', getBookingById);
router.patch('/:id', validate(updateBookingSchema), updateBooking);
router.delete('/:id', validate(cancelBookingSchema), cancelBooking);

// Business routes
router.get('/business/all', requireBusiness, getBusinessBookings);

export default router;
