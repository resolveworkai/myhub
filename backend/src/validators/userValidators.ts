import Joi from 'joi';

export const updateUserProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    address: Joi.string().max(200).required(),
  }).optional(),
  preferences: Joi.object({
    categories: Joi.array().items(Joi.string().valid('gym', 'coaching', 'library')).optional(),
    priceRange: Joi.string().valid('$', '$$', '$$$').optional(),
  }).optional(),
  marketingConsent: Joi.boolean().optional(),
  avatar: Joi.string().uri().optional(),
}).min(1);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, lowercase, number, and special character',
    }),
});
