import Joi from 'joi';

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const suspendBusinessSchema = Joi.object({
  suspend: Joi.boolean().required(),
});

export const suspendUserSchema = Joi.object({
  suspend: Joi.boolean().required(),
});

export const createPassConfigurationSchema = Joi.object({
  name: Joi.string().required().max(200),
  description: Joi.string().allow('', null).optional(),
  passType: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').required(),
  durationDays: Joi.number().integer().positive().required(),
  price: Joi.number().positive().required(),
});

export const updatePassConfigurationSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().allow('', null).optional(),
  passType: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').optional(),
  durationDays: Joi.number().integer().positive().optional(),
  price: Joi.number().positive().optional(),
  isActive: Joi.boolean().optional(),
});

export const updatePlatformSettingSchema = Joi.object({
  value: Joi.any().required(),
  description: Joi.string().allow('', null).optional(),
});
