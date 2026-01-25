import Joi from 'joi';

export const updateBusinessProfileSchema = Joi.object({
  businessName: Joi.string().min(2).max(200).optional(),
  ownerName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  website: Joi.string().uri().optional(),
  address: Joi.object({
    street: Joi.string().max(255).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    postalCode: Joi.string().max(20).optional(),
    country: Joi.string().max(100).optional(),
    lat: Joi.number().min(-90).max(90).optional(),
    lng: Joi.number().min(-180).max(180).optional(),
  }).optional(),
  specialties: Joi.array().items(Joi.string()).optional(),
  serviceAreas: Joi.string().max(500).optional(),
  dailyPackagePrice: Joi.number().min(0).optional(),
  weeklyPackagePrice: Joi.number().min(0).optional(),
  monthlyPackagePrice: Joi.number().min(0).optional(),
}).min(1);

export const addBusinessMemberSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  notes: Joi.string().max(500).optional(),
});

export const sendAnnouncementSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  message: Joi.string().min(10).max(1000).required(),
  memberIds: Joi.array().items(Joi.string().uuid()).optional(),
});
