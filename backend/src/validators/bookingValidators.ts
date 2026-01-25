import Joi from 'joi';

export const createBookingSchema = Joi.object({
  venueId: Joi.string().uuid().required(),
  date: Joi.string().isoDate().required(),
  time: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required(),
  duration: Joi.number().integer().min(15).max(480).default(60),
  attendees: Joi.number().integer().min(1).max(50).default(1),
  specialRequests: Joi.string().max(500).optional(),
  bookingType: Joi.string().valid('one_time', 'monthly', 'membership').default('one_time'),
});

export const updateBookingSchema = Joi.object({
  date: Joi.string().isoDate().optional(),
  time: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  duration: Joi.number().integer().min(15).max(480).optional(),
  attendees: Joi.number().integer().min(1).max(50).optional(),
  specialRequests: Joi.string().max(500).optional(),
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed').optional(),
});

export const cancelBookingSchema = Joi.object({
  reason: Joi.string().max(200).optional(),
});
