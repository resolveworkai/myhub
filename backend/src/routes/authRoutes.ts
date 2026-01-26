import { Router } from 'express';
import {
  memberSignup,
  businessSignup,
  login,
  verifyEmail,
  resendOTP,
  checkEmail,
  checkPhone,
  businessVerifyEmail,
  businessResendOTP,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
} from '../controllers/authController';
import {
  memberSignupSchema,
  businessSignupSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidators';
import { validate } from '../middleware/validation';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/member/signup', authRateLimiter, validate(memberSignupSchema), memberSignup);
router.post('/business/signup', authRateLimiter, validate(businessSignupSchema), businessSignup);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/verify-email', authRateLimiter, validate(verifyOTPSchema), verifyEmail);
router.post('/resend-otp', authRateLimiter, validate(resendOTPSchema), resendOTP);
router.post('/business/verify-email', authRateLimiter, validate(verifyOTPSchema), businessVerifyEmail);
router.post('/business/resend-otp', authRateLimiter, validate(resendOTPSchema), businessResendOTP);
router.get('/check-email', checkEmail);
router.get('/check-phone', checkPhone);

// Password reset routes
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), requestPasswordReset);
router.post('/verify-reset-otp', authRateLimiter, validate(verifyOTPSchema), verifyPasswordResetOTP);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
