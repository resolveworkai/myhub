import Joi from 'joi';

export const listVenuesSchema = Joi.object({
  category: Joi.string().valid('all', 'gym', 'coaching', 'library').optional(),
  city: Joi.string().optional(),
  minRating: Joi.number().min(0).max(5).optional(),
  priceRange: Joi.string().valid('$', '$$', '$$$').optional(),
  radius: Joi.number().min(0).optional(),
  userLat: Joi.number().min(-90).max(90).optional(),
  userLng: Joi.number().min(-180).max(180).optional(),
  search: Joi.string().max(200).optional(),
  amenities: Joi.string().optional(),
  status: Joi.string().valid('available', 'filling', 'full').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const checkAvailabilitySchema = Joi.object({
  date: Joi.string().isoDate().required(),
  time: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required(),
});
