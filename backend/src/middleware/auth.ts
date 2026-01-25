import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { pool } from '../db/pool';
import { AuthenticationError } from '../utils/errors';

interface JWTPayload {
  userId: string;
  email: string;
  accountType: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        accountType: string;
      };
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Get user from database to ensure still active
    const userQuery =
      decoded.accountType === 'user'
        ? `SELECT id, email, account_status FROM users WHERE id = $1 AND deleted_at IS NULL`
        : `SELECT id, email, account_status FROM business_users WHERE id = $1 AND deleted_at IS NULL`;

    const userResult = await pool.query(userQuery, [decoded.userId]);

    if (userResult.rows.length === 0) {
      throw new AuthenticationError('User not found');
    }

    const user = userResult.rows[0];

    if (user.account_status === 'suspended') {
      throw new AuthenticationError('Account is suspended');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      accountType: decoded.accountType,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: {
          message: error.message,
          code: 'UNAUTHORIZED',
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'UNAUTHORIZED',
        },
      });
      return;
    }

    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      const userQuery =
        decoded.accountType === 'user'
          ? `SELECT id, email, account_status FROM users WHERE id = $1 AND deleted_at IS NULL`
          : `SELECT id, email, account_status FROM business_users WHERE id = $1 AND deleted_at IS NULL`;

      const userResult = await pool.query(userQuery, [decoded.userId]);

      if (userResult.rows.length > 0 && userResult.rows[0].account_status !== 'suspended') {
        req.user = {
          id: userResult.rows[0].id,
          email: userResult.rows[0].email,
          accountType: decoded.accountType,
        };
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Require business account
 */
export const requireBusiness = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      },
    });
    return;
  }

  if (req.user.accountType !== 'business_user') {
    res.status(403).json({
      success: false,
      error: {
        message: 'Business account required',
        code: 'FORBIDDEN',
      },
    });
    return;
  }

  next();
};

/**
 * Require normal user account
 */
export const requireUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      },
    });
    return;
  }

  if (req.user.accountType !== 'user') {
    res.status(403).json({
      success: false,
      error: {
        message: 'User account required',
        code: 'FORBIDDEN',
      },
    });
    return;
  }

  next();
};
