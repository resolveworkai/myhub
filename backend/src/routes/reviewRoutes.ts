import { Router } from 'express';
import {
  createReview,
  updateReview,
  deleteReview,
  addBusinessReply,
} from '../controllers/reviewController';
import { authenticate, requireBusiness } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createReviewSchema,
  updateReviewSchema,
  addBusinessReplySchema,
} from '../validators/reviewValidators';

const router = Router();

// Create review requires authentication
router.post('/', authenticate, validate(createReviewSchema), createReview);

// Update/delete review requires authentication
router.patch('/:id', authenticate, validate(updateReviewSchema), updateReview);
router.delete('/:id', authenticate, deleteReview);

// Business reply requires business account
router.post('/:id/reply', authenticate, requireBusiness, validate(addBusinessReplySchema), addBusinessReply);

export default router;
