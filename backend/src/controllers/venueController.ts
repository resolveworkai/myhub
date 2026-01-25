import { Request, Response } from 'express';
import { venueService } from '../services/venueService';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * List venues with filters
 */
export const listVenues = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    category: req.query.category as any,
    city: req.query.city as string,
    minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
    priceRange: req.query.priceRange as string,
    radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
    userLat: req.query.userLat ? parseFloat(req.query.userLat as string) : undefined,
    userLng: req.query.userLng ? parseFloat(req.query.userLng as string) : undefined,
    searchQuery: req.query.search as string,
    amenities: req.query.amenities ? (req.query.amenities as string).split(',') : undefined,
    status: req.query.status as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
  };

  const result = await venueService.listVenues(filters);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get venue by ID
 */
export const getVenueById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const venue = await venueService.getVenueById(id);

  res.json({
    success: true,
    data: venue,
  });
});

/**
 * Get venue schedule
 */
export const getVenueSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date } = req.query;

  const schedule = await venueService.getVenueSchedule(id, date as string);

  res.json({
    success: true,
    data: schedule,
  });
});

/**
 * Get venue reviews
 */
export const getVenueReviews = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  const result = await venueService.getVenueReviews(id, page, limit);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Check venue availability
 */
export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date, time } = req.query;

  if (!date || !time) {
    return res.status(400).json({
      success: false,
      error: { message: 'Date and time are required', code: 'VALIDATION_ERROR' },
    });
  }

  const availability = await venueService.checkAvailability(
    id,
    date as string,
    time as string
  );

  res.json({
    success: true,
    data: availability,
  });
});
