import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { AuthenticatedRequest, JwtPayload } from '../types/index.js';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authorization header is required',
    });
    return;
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization header format. Use: Bearer <token>',
    });
    return;
  }
  
  const token = parts[1];
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token has expired',
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    next();
    return;
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }
  
  const token = parts[1];
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };
  } catch {
    // Token invalid or expired, but that's okay for optional auth
  }
  
  next();
}
