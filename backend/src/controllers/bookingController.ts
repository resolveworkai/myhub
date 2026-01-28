import { Request, Response } from 'express';
import { bookingService } from '../services/bookingService';
import { asyncHandler } from '../middleware/errorHandler';
import { pool } from '@/db/pool';

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

/**
 * Update booking status (for business users)
 */
export const updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Valid status is required', code: 'VALIDATION_ERROR' },
    });
  }

  const booking = await bookingService.updateBookingStatus(id, businessUserId, status);

  res.json({
    success: true,
    message: 'Booking status updated successfully',
    data: booking,
  });
});

/**
 * Create booking for business (walk-in/appointment)
 */
export const createBusinessBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const { userName, userEmail, userPhone, venueId, date, time, duration, attendees, specialRequests } = req.body;

  if (!userName || !venueId || !date || !time || !duration) {
    return res.status(400).json({
      success: false,
      error: { message: 'userName, venueId, date, time, and duration are required', code: 'VALIDATION_ERROR' },
    });
  }

  // Get business venue if venueId not provided or is "default"
  let finalVenueId = venueId;
  if (!finalVenueId || finalVenueId === "default") {
    const venueResult = await pool.query(
      `SELECT id FROM venues WHERE business_user_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [businessUserId]
    );
    if (venueResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'No venue found for this business. Please create a venue first.', code: 'NOT_FOUND' },
      });
    }
    finalVenueId = venueResult.rows[0].id;
  }

  const booking = await bookingService.createBusinessBooking(businessUserId, {
    userName,
    userEmail,
    userPhone,
    venueId: finalVenueId,
    date,
    time,
    duration,
    attendees,
    specialRequests,
  });

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: booking,
  });
});