import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Member signup
 */
export const memberSignup = asyncHandler(async (req: Request, res: Response) => {
  const signupData = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    countryCode: req.body.countryCode || '+971',
    password: req.body.password,
    location: req.body.location,
    categories: req.body.categories || [],
    marketingConsent: req.body.marketingConsent || false,
  };

  const result = await authService.memberSignup(signupData);

  res.status(201).json({
    success: true,
    message: 'Account created successfully! Please verify your email.',
    data: {
      userId: result.userId,
      email: result.email,
    },
  });
});

/**
 * Business signup
 */
export const businessSignup = asyncHandler(async (req: Request, res: Response) => {
  const signupData = {
    businessName: req.body.businessName,
    businessType: req.body.businessType,
    registrationNumber: req.body.registrationNumber,
    yearsInOperation: req.body.yearsInOperation,
    ownerName: req.body.ownerName,
    email: req.body.email,
    phone: req.body.phone,
    countryCode: req.body.countryCode || '+971',
    website: req.body.website,
    address: req.body.address,
    numberOfLocations: req.body.numberOfLocations,
    totalCapacity: req.body.totalCapacity,
    specialties: req.body.specialties || [],
    serviceAreas: req.body.serviceAreas,
    password: req.body.password,
    accountManagerEmail: req.body.accountManagerEmail,
    subscriptionTier: req.body.subscriptionTier || 'starter',
  };

  const result = await authService.businessSignup(signupData);

  res.status(201).json({
    success: true,
    message: 'Business account created! Your account is pending verification.',
    data: {
      userId: result.userId,
      email: result.email,
    },
  });
});

/**
 * Login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const credentials = {
    identifier: req.body.identifier,
    password: req.body.password,
    rememberMe: req.body.rememberMe || false,
  };

  try {
    const result = await authService.login(credentials);

    // Remove sensitive data
    const { password_hash, ...userWithoutPassword } = result.user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        tokens: result.tokens,
      },
    });
  } catch (error: any) {
    // Handle email verification required case
    if (error.code === 'EMAIL_VERIFICATION_REQUIRED') {
      return res.status(401).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
        requiresVerification: true,
      });
    }
    throw error;
  }
});

/**
 * Verify email OTP
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  await authService.verifyEmail(email, otp);

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

/**
 * Resend OTP
 */
export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  await authService.resendOTP(email);

  res.json({
    success: true,
    message: 'A new verification code has been sent to your email.',
  });
});

/**
 * Check email exists
 */
export const checkEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      error: { message: 'Email is required', code: 'VALIDATION_ERROR' },
    });
  }

  const exists = await authService.checkEmailExists(email);

  res.json({
    success: true,
    data: { exists },
  });
});

/**
 * Check phone exists
 */
export const checkPhone = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.query;

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({
      success: false,
      error: { message: 'Phone is required', code: 'VALIDATION_ERROR' },
    });
  }

  const exists = await authService.checkPhoneExists(phone);

  res.json({
    success: true,
    data: { exists },
  });
});
