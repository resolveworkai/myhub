import { Request, Response } from 'express';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    accountType: string;
  };
}

/**
 * Admin login
 */
export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email and password are required', code: 'VALIDATION_ERROR' },
    });
  }

  const admin = await adminService.adminLogin(email, password);
  const tokens = authService.generateTokens(admin.id, admin.email, 'admin');

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      ...tokens,
    },
  });
});

/**
 * Get dashboard statistics
 */
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await adminService.getDashboardStats();

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * Get all businesses
 */
export const getBusinesses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = {
    search: req.query.search as string,
    businessType: req.query.businessType as string,
    verificationStatus: req.query.verificationStatus as string,
    accountStatus: req.query.accountStatus as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await adminService.getBusinesses(filters);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Verify business
 */
export const verifyBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  await adminService.verifyBusiness(id, adminId);

  res.json({
    success: true,
    message: 'Business verified successfully',
  });
});

/**
 * Suspend business
 */
export const suspendBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { suspend } = req.body;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  if (typeof suspend !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: { message: 'suspend must be a boolean', code: 'VALIDATION_ERROR' },
    });
  }

  await adminService.suspendBusiness(id, adminId, suspend);

  res.json({
    success: true,
    message: suspend ? 'Business suspended successfully' : 'Business activated successfully',
  });
});

/**
 * Delete business
 */
export const deleteBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  await adminService.deleteBusiness(id, adminId);

  res.json({
    success: true,
    message: 'Business deleted successfully',
  });
});

/**
 * Get all users
 */
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = {
    search: req.query.search as string,
    accountStatus: req.query.accountStatus as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await adminService.getUsers(filters);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get user details
 */
export const getUserDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const user = await adminService.getUserDetails(id);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Suspend user
 */
export const suspendUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { suspend } = req.body;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  if (typeof suspend !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: { message: 'suspend must be a boolean', code: 'VALIDATION_ERROR' },
    });
  }

  await adminService.suspendUser(id, adminId, suspend);

  res.json({
    success: true,
    message: suspend ? 'User suspended successfully' : 'User activated successfully',
  });
});

/**
 * Get pass configurations
 */
export const getPassConfigurations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const configs = await adminService.getPassConfigurations();

  res.json({
    success: true,
    data: configs,
  });
});

/**
 * Create pass configuration
 */
export const createPassConfiguration = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, passType, durationDays, price } = req.body;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  if (!name || !passType || !durationDays || price === undefined) {
    return res.status(400).json({
      success: false,
      error: { message: 'Name, passType, durationDays, and price are required', code: 'VALIDATION_ERROR' },
    });
  }

  const config = await adminService.createPassConfiguration({
    name,
    description,
    passType,
    durationDays: parseInt(durationDays),
    price: parseFloat(price),
    adminId,
  });

  res.status(201).json({
    success: true,
    message: 'Pass configuration created successfully',
    data: config,
  });
});

/**
 * Update pass configuration
 */
export const updatePassConfiguration = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  const { name, description, passType, durationDays, price, isActive } = req.body;

  const config = await adminService.updatePassConfiguration(id, {
    name,
    description,
    passType,
    durationDays: durationDays ? parseInt(durationDays) : undefined,
    price: price !== undefined ? parseFloat(price) : undefined,
    isActive,
    adminId,
  });

  res.json({
    success: true,
    message: 'Pass configuration updated successfully',
    data: config,
  });
});

/**
 * Delete pass configuration
 */
export const deletePassConfiguration = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  await adminService.deletePassConfiguration(id, adminId);

  res.json({
    success: true,
    message: 'Pass configuration deleted successfully',
  });
});

/**
 * Get analytics
 */
export const getAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const period = (req.query.period as string) || 'month';

  const analytics = await adminService.getAnalytics(period);

  res.json({
    success: true,
    data: analytics,
  });
});

/**
 * Get platform settings
 */
export const getPlatformSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await adminService.getPlatformSettings();

  res.json({
    success: true,
    data: settings,
  });
});

/**
 * Update platform setting
 */
export const updatePlatformSetting = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const { value, description } = req.body;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  if (value === undefined) {
    return res.status(400).json({
      success: false,
      error: { message: 'value is required', code: 'VALIDATION_ERROR' },
    });
  }

  await adminService.updatePlatformSetting(key, value, adminId, description);

  res.json({
    success: true,
    message: 'Platform setting updated successfully',
  });
});
