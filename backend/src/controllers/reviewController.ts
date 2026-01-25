import { Request, Response } from 'express';
import { reviewService } from '../services/reviewService';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    accountType: string;
  };
}

/**
 * Create review
 */
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const reviewData = {
    userId,
    venueId: req.body.venueId,
    bookingId: req.body.bookingId,
    rating: req.body.rating,
    comment: req.body.comment,
  };

  const review = await reviewService.createReview(reviewData);

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review,
  });
});

/**
 * Update review
 */
export const updateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const updateData = {
    rating: req.body.rating,
    comment: req.body.comment,
  };

  const review = await reviewService.updateReview(id, userId, updateData);

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: review,
  });
});

/**
 * Delete review
 */
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  await reviewService.deleteReview(id, userId);

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
});

/**
 * Add business reply to review
 */
export const addBusinessReply = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const { reply } = req.body;

  if (!reply) {
    return res.status(400).json({
      success: false,
      error: { message: 'Reply is required', code: 'VALIDATION_ERROR' },
    });
  }

  const review = await reviewService.addBusinessReply(id, businessUserId, reply);

  res.json({
    success: true,
    message: 'Reply added successfully',
    data: review,
  });
});
