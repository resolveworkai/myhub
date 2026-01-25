import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  errorHandler(err, req as Express.Request, res, next);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
