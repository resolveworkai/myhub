import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { asyncHandler } from '../middleware/errorHandler';

// Extend Request to include user info from auth middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    accountType: string;
  };
}

/**
 * Get business payments
 */
export const getBusinessPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const filters = {
    status: req.query.status as string,
    type: req.query.type as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await paymentService.getBusinessPayments(businessUserId, filters);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Create payment record
 */
export const createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const { userId, amount, type, paymentMethod, dueDate, notes, memberName, memberEmail, memberPhone } = req.body;

  if ((!userId && !memberEmail && !memberName) || !amount || !type) {
    return res.status(400).json({
      success: false,
      error: { message: 'Either userId or (memberName/memberEmail), amount, and type are required', code: 'VALIDATION_ERROR' },
    });
  }

  const payment = await paymentService.createPayment({
    userId: userId || undefined,
    businessUserId,
    amount: parseFloat(amount),
    type,
    paymentMethod,
    dueDate,
    notes,
    memberName,
    memberEmail,
    memberPhone,
  });

  res.json({
    success: true,
    message: 'Payment record created successfully',
    data: payment,
  });
});

/**
 * Update payment status
 */
export const updatePaymentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const { id } = req.params;
  const { status, paymentMethod } = req.body;

  if (!status || !['pending', 'completed', 'failed', 'refunded'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Valid status is required', code: 'VALIDATION_ERROR' },
    });
  }

  const payment = await paymentService.updatePaymentStatus(id, businessUserId, status, paymentMethod);

  res.json({
    success: true,
    message: 'Payment status updated successfully',
    data: payment,
  });
});

/**
 * Get business payment stats
 */
export const getBusinessPaymentStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const businessUserId = req.user?.id;

  if (!businessUserId || req.user?.accountType !== 'business_user') {
    return res.status(403).json({
      success: false,
      error: { message: 'Business account required', code: 'FORBIDDEN' },
    });
  }

  const stats = await paymentService.getBusinessPaymentStats(businessUserId);

  res.json({
    success: true,
    data: stats,
  });
});
