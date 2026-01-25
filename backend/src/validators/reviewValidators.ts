import Joi from 'joi';

export const createReviewSchema = Joi.object({
  venueId: Joi.string().uuid().required(),
  bookingId: Joi.string().uuid().optional(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(10).max(1000).required(),
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  comment: Joi.string().min(10).max(1000).optional(),
}).min(1);

export const addBusinessReplySchema = Joi.object({
  reply: Joi.string().min(10).max(500).required(),
});
