import { z } from 'zod';

// Validation schemas
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters')
  .transform((val) => val.toLowerCase());

export const phoneSchema = z
  .string()
  .min(10, 'Please enter a valid phone number')
  .regex(/^[\d\s\-+()]+$/, 'Please enter a valid phone number');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must include at least one special character');

export const businessNameSchema = z
  .string()
  .min(2, 'Business name must be at least 2 characters')
  .max(100, 'Business name must be less than 100 characters');

export const registrationNumberSchema = z
  .string()
  .min(8, 'Registration number must be at least 8 characters')
  .max(15, 'Registration number must be less than 15 characters')
  .regex(/^[a-zA-Z0-9\-]+$/, 'Registration number can only contain alphanumeric characters and hyphens');

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .optional()
  .or(z.literal(''));

// Step 1: Personal Information (Normal User)
export const personalInfoSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  countryCode: z.string().default('+971'),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
  }).optional(),
});

// Step 2: Account Security (Normal User)
export const securitySchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Step 3: Preferences (Normal User)
export const preferencesSchema = z.object({
  categories: z.array(z.string()).min(0),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions to continue",
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: "You must accept the privacy policy to continue",
  }),
  marketingConsent: z.boolean().default(false),
});

// Business User schemas
export const businessInfoSchema = z.object({
  businessName: businessNameSchema,
  businessType: z.enum(['gym', 'coaching', 'library']),
  registrationNumber: registrationNumberSchema,
  yearsInOperation: z.string(),
});

export const businessContactSchema = z.object({
  ownerName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  countryCode: z.string().default('+971'),
  website: urlSchema,
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().default('UAE'),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
});

export const businessDetailsSchema = z.object({
  numberOfLocations: z.string(),
  totalCapacity: z.number().min(1, 'Capacity must be at least 1'),
  serviceAreas: z.string().max(500, 'Description must be less than 500 characters'),
});

export const businessSecuritySchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
  accountManagerEmail: emailSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const businessSubscriptionSchema = z.object({
  subscriptionTier: z.enum(['starter', 'growth', 'enterprise']).default('starter'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: "You must accept the privacy policy",
  }),
  verificationConsent: z.boolean().refine((val) => val === true, {
    message: "You must consent to business verification",
  }),
});

// Login schema
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Please enter your email or phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// OTP schema
export const otpSchema = z.object({
  otp: z.string().length(6, 'Please enter all 6 digits'),
});

// Password strength calculator
export const getPasswordStrength = (password: string): {
  score: number;
  label: 'weak' | 'medium' | 'strong' | 'very-strong';
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (password.length >= 16) score++;
  
  if (score <= 2) return { score, label: 'weak', color: 'bg-destructive' };
  if (score <= 4) return { score, label: 'medium', color: 'bg-warning' };
  if (score <= 5) return { score, label: 'strong', color: 'bg-success' };
  return { score, label: 'very-strong', color: 'bg-info' };
};

// Format phone number
export const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

// Validate email or phone
export const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isValidPhone = (value: string): boolean => {
  return /^[\d\s\-+()]{10,}$/.test(value);
};
