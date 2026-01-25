import { Request, Response } from 'express';
import { bookingService } from '../services/bookingService';
import { asyncHandler } from '../middleware/errorHandler';

// Extend Request to include user info from auth middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    accountType: string;
  };
}

/**
 * Create booking
 */
export const createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const bookingData = {
    userId,
    venueId: req.body.venueId,
    date: req.body.date,
    time: req.body.time,
    duration: req.body.duration || 60,
    attendees: req.body.attendees || 1,
    specialRequests: req.body.specialRequests,
    bookingType: req.body.bookingType || 'one_time',
  };

  const booking = await bookingService.createBooking(bookingData);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking,
  });
});

/**
 * Get user bookings
 */
export const getUserBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const filters = {
    status: req.query.status as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await bookingService.getUserBookings(userId, filters);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get booking by ID
 */
export const getBookingById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const booking = await bookingService.getBookingById(id, userId);

  res.json({
    success: true,
    data: booking,
  });
});

/**
 * Update booking
 */
export const updateBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const updateData = {
    date: req.body.date,
    time: req.body.time,
    duration: req.body.duration,
    attendees: req.body.attendees,
    specialRequests: req.body.specialRequests,
    status: req.body.status,
  };

  const booking = await bookingService.updateBooking(id, userId, updateData);

  res.json({
    success: true,
    message: 'Booking updated successfully',
    data: booking,
  });
});

/**
 * Cancel booking
 */
export const cancelBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const reason = req.body.reason;

  await bookingService.cancelBooking(id, userId, reason);

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
  });
});

/**
 * Get business bookings
 */
export const getBusinessBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const filters = {
    status: req.query.status as string,
    date: req.query.date as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await bookingService.getBusinessBookings(businessUserId, filters);

  res.json({
    success: true,
    data: result,
  });
});
