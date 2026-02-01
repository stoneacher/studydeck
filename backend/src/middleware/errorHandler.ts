import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

/**
 * Global error handler middleware
 * Catches all errors and returns appropriate responses
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', error);
  
  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }
  
  // Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        res.status(409).json({
          success: false,
          error: 'A record with this value already exists',
        });
        return;
      case 'P2025':
        // Record not found
        res.status(404).json({
          success: false,
          error: 'Record not found',
        });
        return;
      case 'P2003':
        // Foreign key constraint failed
        res.status(400).json({
          success: false,
          error: 'Related record not found',
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: 'Database error',
        });
        return;
    }
  }
  
  if (error instanceof PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: 'Invalid data provided',
    });
    return;
  }
  
  // Generic errors
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
  });
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.path}`,
  });
}
