import type { Request } from 'express';
import type { User } from '@prisma/client';

// Authenticated request with user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// JWT payload structure
export interface JwtPayload {
  userId: string;
  email: string;
}

// User without sensitive fields
export type SafeUser = Omit<User, 'passwordHash'>;

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Pagination result
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Card review quality ratings (SM-2 scale)
export enum ReviewQuality {
  COMPLETE_BLACKOUT = 0,      // Complete failure to recall
  INCORRECT_REMEMBERED = 1,   // Incorrect, but remembered upon seeing answer
  INCORRECT_EASY_RECALL = 2,  // Incorrect, but answer felt easy to recall
  CORRECT_DIFFICULT = 3,      // Correct with serious difficulty
  CORRECT_HESITATION = 4,     // Correct after hesitation
  PERFECT = 5,                // Perfect response
}

// CSV import/export types
export interface CsvCardRow {
  front: string;
  back: string;
  type?: 'BASIC' | 'CLOZE';
  notes?: string;
  tags?: string; // Comma-separated tags
}

export interface CsvDeckRow {
  name: string;
  description?: string;
  parentName?: string; // For hierarchical import
}

// AI-related types
export interface GeneratedCard {
  front: string;
  back: string;
  type: 'BASIC' | 'CLOZE';
}

export interface ClozesuggestionResult {
  original: string;
  suggestions: string[];
}
