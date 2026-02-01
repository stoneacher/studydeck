import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import * as studyService from '../services/study.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// All study routes require authentication
router.use(authenticate);

// Validation schemas
const createSessionSchema = z.object({
  deckId: z.string().min(1, 'Deck ID is required'),
});

/**
 * POST /api/study/sessions
 * Start a new study session
 */
router.post('/sessions', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const session = await studyService.createSession(req.user!.id, data);
    
    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Deck not found') {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/study/sessions/:id/end
 * End a study session
 */
router.post('/sessions/:id/end', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const session = await studyService.endSession(req.user!.id, req.params.id);
    
    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Session not found') {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/study/sessions/:id
 * Get session details with statistics
 */
router.get('/sessions/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const session = await studyService.getSessionWithStats(req.user!.id, req.params.id);
    
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/study/sessions
 * Get recent study sessions
 */
router.get('/sessions', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 50);
    const sessions = await studyService.getRecentSessions(req.user!.id, limit);
    
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/study/stats
 * Get overall study statistics
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const stats = await studyService.getUserStats(req.user!.id);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
