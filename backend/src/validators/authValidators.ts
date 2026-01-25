import Joi from 'joi';

// Member signup validators
export const memberSignupPersonalInfoSchema = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be less than 50 characters',
      'string.pattern.base': 'Name can only contain letters and spaces',
    }),
  email: Joi.string()
    .email()
    .max(255)
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.max': 'Email must be less than 255 characters',
    }),
  phone: Joi.string()
    .min(8)
    .pattern(/^[\d\s\-+()]+$/)
    .required()
    .messages({
      'string.min': 'Please enter a valid phone number',
      'string.pattern.base': 'Please enter a valid phone number',
    }),
  countryCode: Joi.string().default('+971'),
  location: Joi.object({
    lat: Joi.number().optional(),
    lng: Joi.number().optional(),
    address: Joi.string().optional(),
  }).optional(),
});

export const memberSignupSecuritySchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .pattern(/[!@#$%^&*(),.?":{}|<>]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must be less than 128 characters',
      'string.pattern.base': 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
    }),
});

export const memberSignupPreferencesSchema = Joi.object({
  categories: Joi.array().items(Joi.string()).default([]),
  acceptTerms: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the terms and conditions to continue',
  }),
  acceptPrivacy: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the privacy policy to continue',
  }),
  marketingConsent: Joi.boolean().default(false),
});

export const memberSignupSchema = memberSignupPersonalInfoSchema
  .concat(memberSignupSecuritySchema)
  .concat(memberSignupPreferencesSchema);

// Business signup validators
export const businessSignupInfoSchema = Joi.object({
  businessName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Business name must be at least 2 characters',
      'string.max': 'Business name must be less than 100 characters',
    }),
  businessType: Joi.string()
    .valid('gym', 'coaching', 'library')
    .required(),
  registrationNumber: Joi.string()
    .min(8)
    .max(15)
    .pattern(/^[a-zA-Z0-9\-]+$/)
    .required()
    .messages({
      'string.min': 'Registration number must be at least 8 characters',
      'string.max': 'Registration number must be less than 15 characters',
      'string.pattern.base': 'Only alphanumeric characters and hyphens allowed',
    }),
  yearsInOperation: Joi.string().required(),
});

export const businessSignupContactSchema = Joi.object({
  ownerName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be less than 50 characters',
      'string.pattern.base': 'Name can only contain letters and spaces',
    }),
  email: Joi.string()
    .email()
    .max(255)
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
    }),
  phone: Joi.string()
    .min(8)
    .pattern(/^[\d\s\-+()]+$/)
    .required()
    .messages({
      'string.min': 'Please enter a valid phone number',
    }),
  countryCode: Joi.string().default('+971'),
  website: Joi.string()
    .uri()
    .allow('')
    .optional()
    .messages({
      'string.uri': 'Please enter a valid URL',
    }),
  address: Joi.object({
    street: Joi.string().min(1).required().messages({
      'string.min': 'Street address is required',
    }),
    city: Joi.string().min(1).required().messages({
      'string.min': 'City is required',
    }),
    state: Joi.string().min(1).required().messages({
      'string.min': 'State/Emirate is required',
    }),
    postalCode: Joi.string().min(1).required().messages({
      'string.min': 'Postal code is required',
    }),
    country: Joi.string().default('UAE'),
    lat: Joi.number().optional(),
    lng: Joi.number().optional(),
  }).required(),
});

export const businessSignupDetailsSchema = Joi.object({
  numberOfLocations: Joi.string().required(),
  totalCapacity: Joi.number().min(1).required().messages({
    'number.min': 'Capacity must be at least 1',
  }),
  specialties: Joi.array().items(Joi.string()).default([]),
  serviceAreas: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description must be less than 500 characters',
  }),
});

export const businessSignupSecuritySchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .pattern(/[!@#$%^&*(),.?":{}|<>]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
    }),
  accountManagerEmail: Joi.string()
    .email()
    .lowercase()
    .allow('')
    .optional()
    .messages({
      'string.email': 'Please enter a valid email',
    }),
});

export const businessSignupSubscriptionSchema = Joi.object({
  subscriptionTier: Joi.string()
    .valid('starter', 'growth', 'enterprise')
    .default('starter'),
  acceptTerms: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the terms and conditions',
  }),
  acceptPrivacy: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the privacy policy',
  }),
  verificationConsent: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must consent to business verification',
  }),
});

export const businessSignupSchema = businessSignupInfoSchema
  .concat(businessSignupContactSchema)
  .concat(businessSignupDetailsSchema)
  .concat(businessSignupSecuritySchema)
  .concat(businessSignupSubscriptionSchema);

// Login validator
export const loginSchema = Joi.object({
  identifier: Joi.string().min(1).required().messages({
    'string.min': 'Please enter your email or phone number',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
  }),
  rememberMe: Joi.boolean().default(false),
});

// OTP verification validator
export const verifyOTPSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.length': 'Please enter all 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
    }),
});

// Resend OTP validator
export const resendOTPSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

// Forgot password validator
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

// Reset password validator
export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .pattern(/[!@#$%^&*(),.?":{}|<>]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
    }),
});
