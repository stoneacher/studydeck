import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import * as tagService from '../services/tag.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// All tag routes require authentication
router.use(authenticate);

// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().nullable(),
});

/**
 * GET /api/tags
 * Get all tags for the current user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tags = await tagService.getTags(req.user!.id);
    
    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tags
 * Create a new tag
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = createTagSchema.parse(req.body);
    const tag = await tagService.createTag(req.user!.id, data);
    
    res.status(201).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/tags/:id
 * Update a tag
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = updateTagSchema.parse(req.body);
    const tag = await tagService.updateTag(req.user!.id, req.params.id, data);
    
    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Tag not found') {
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
 * DELETE /api/tags/:id
 * Delete a tag
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    await tagService.deleteTag(req.user!.id, req.params.id);
    
    res.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Tag not found') {
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
 * GET /api/tags/:id/cards
 * Get all cards with a specific tag
 */
router.get('/:id/cards', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const cards = await tagService.getCardsByTag(req.user!.id, req.params.id);
    
    res.json({
      success: true,
      data: cards,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Tag not found') {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

export default router;
