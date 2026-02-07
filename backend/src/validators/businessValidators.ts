import Joi from 'joi';

export const updateBusinessInfoSchema = Joi.object({
  businessName: Joi.string().min(2).max(200).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  website: Joi.string().uri().allow('').optional(),
  address: Joi.string().max(500).optional(),
  description: Joi.string().max(2000).optional(),
});

export const updateLocationAndMediaSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  logo: Joi.string().uri().allow('').optional(),
  coverImage: Joi.string().uri().allow('').optional(),
  galleryImages: Joi.array().items(Joi.string().uri()).optional(),
});

export const updateBusinessAttributesSchema = Joi.object({
  amenities: Joi.array().items(Joi.string()).optional(),
  equipment: Joi.array().items(Joi.string()).optional(),
  classTypes: Joi.array().items(Joi.string()).optional(),
  membershipOptions: Joi.array().items(Joi.string()).optional(),
  subjects: Joi.array().items(Joi.string()).optional(),
  levels: Joi.array().items(Joi.string()).optional(),
  teachingModes: Joi.array().items(Joi.string()).optional(),
  batchSizes: Joi.array().items(Joi.string()).optional(),
  facilities: Joi.array().items(Joi.string()).optional(),
  collections: Joi.array().items(Joi.string()).optional(),
  spaceTypes: Joi.array().items(Joi.string()).optional(),
}).unknown(true); // Allow other attributes

export const updatePricingSchema = Joi.object({
  dailyPackagePrice: Joi.number().min(0).optional(),
  weeklyPackagePrice: Joi.number().min(0).optional(),
  monthlyPackagePrice: Joi.number().min(0).optional(),
});

export const updateOperatingHoursSchema = Joi.object().pattern(
  Joi.string(),
  Joi.alternatives().try(
    // New format: with timeSlots array
    Joi.object({
      timeSlots: Joi.array().items(
        Joi.object({
          open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required(),
          close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required(),
        })
      ).min(1).required(),
      closed: Joi.boolean().optional(),
    }),
    // Old format: backward compatibility
    Joi.object({
      open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required(),
      close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required(),
      closed: Joi.boolean().optional(),
    })
  )
);

export const updateNotificationPreferencesSchema = Joi.object({
  emailBookings: Joi.boolean().optional(),
  emailPayments: Joi.boolean().optional(),
  emailReminders: Joi.boolean().optional(),
  smsBookings: Joi.boolean().optional(),
  smsPayments: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
});

export const updateSecuritySettingsSchema = Joi.object({
  twoFactor: Joi.boolean().optional(),
  sessionTimeout: Joi.string().valid('15', '30', '60', '120').optional(),
});

export const togglePublishSchema = Joi.object({
  isPublished: Joi.boolean().required(),
});

// Existing validators (if not already defined elsewhere)
export const updateBusinessProfileSchema = Joi.object({
  businessName: Joi.string().min(2).max(200).optional(),
  ownerName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().optional(),
  website: Joi.string().uri().allow('').optional(),
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
  serviceAreas: Joi.string().max(1000).optional(),
  dailyPackagePrice: Joi.number().min(0).optional(),
  weeklyPackagePrice: Joi.number().min(0).optional(),
  monthlyPackagePrice: Joi.number().min(0).optional(),
}).min(1);

export const addBusinessMemberSchema = Joi.object({
  userName: Joi.string().min(2).max(100).required(),
  userEmail: Joi.string().email().allow('').optional(),
  userPhone: Joi.string().allow('').optional(),
  membershipType: Joi.string().valid('daily', 'weekly', 'monthly').required(),
  price: Joi.number().min(0).required(),
  notes: Joi.string().max(500).allow('').optional(),
});

export const sendAnnouncementSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  message: Joi.string().min(10).max(1000).required(),
  memberIds: Joi.array().items(Joi.string().uuid()).optional(),
});

export const cancelMembershipSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});
