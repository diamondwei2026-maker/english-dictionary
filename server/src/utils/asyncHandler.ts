import { Request, Response, NextFunction } from "express";

/**
 * Wraps an async route handler so that any thrown / rejected error
 * is forwarded to Express error-handling middleware via next(err).
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
