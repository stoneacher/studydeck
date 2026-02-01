import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import * as cardService from '../services/card.service.js';
import * as aiService from '../services/ai.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// All card routes require authentication
router.use(authenticate);

// Validation schemas
const createCardSchema = z.object({
  deckId: z.string().min(1, 'Deck ID is required'),
  type: z.enum(['BASIC', 'CLOZE']).default('BASIC'),
  front: z.string().min(1, 'Front content is required'),
  back: z.string(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateCardSchema = z.object({
  type: z.enum(['BASIC', 'CLOZE']).optional(),
  front: z.string().min(1).optional(),
  back: z.string().optional(),
  notes: z.string().optional().nullable(),
  deckId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const reviewCardSchema = z.object({
  quality: z.number().min(0).max(5),
  sessionId: z.string().min(1),
});

const generateCardsSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters'),
});

const suggestClozeSchema = z.object({
  text: z.string().min(5, 'Text must be at least 5 characters'),
});

/**
 * POST /api/cards
 * Create a new card
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = createCardSchema.parse(req.body);
    const card = await cardService.createCard(req.user!.id, data);
    
    res.status(201).json({
      success: true,
      data: card,
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
 * POST /api/cards/bulk
 * Create multiple cards at once
 */
router.post('/bulk', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const cardsData = z.array(createCardSchema).parse(req.body);
    const count = await cardService.createCards(req.user!.id, cardsData);
    
    res.status(201).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cards/:id
 * Get a specific card
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const card = await cardService.getCardById(req.user!.id, req.params.id);
    
    if (!card) {
      res.status(404).json({
        success: false,
        error: 'Card not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/cards/:id
 * Update a card
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = updateCardSchema.parse(req.body);
    const card = await cardService.updateCard(req.user!.id, req.params.id, data);
    
    res.json({
      success: true,
      data: card,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Card not found') {
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
 * DELETE /api/cards/:id
 * Delete a card
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    await cardService.deleteCard(req.user!.id, req.params.id);
    
    res.json({
      success: true,
      message: 'Card deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Card not found') {
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
 * POST /api/cards/:id/review
 * Submit a review for a card (updates spaced repetition)
 */
router.post('/:id/review', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = reviewCardSchema.parse(req.body);
    const card = await cardService.reviewCard(req.user!.id, req.params.id, data);
    
    res.json({
      success: true,
      data: card,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Card not found') {
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
 * POST /api/cards/:id/reset
 * Reset a card's spaced repetition progress
 */
router.post('/:id/reset', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const card = await cardService.resetCard(req.user!.id, req.params.id);
    
    res.json({
      success: true,
      data: card,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Card not found') {
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
 * POST /api/cards/generate
 * Generate flashcards from text using AI
 */
router.post('/generate', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = generateCardsSchema.parse(req.body);
    const cards = aiService.generateCardsFromText(data.text);
    
    res.json({
      success: true,
      data: cards,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cards/suggest-cloze
 * Get cloze deletion suggestions for text
 */
router.post('/suggest-cloze', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = suggestClozeSchema.parse(req.body);
    const suggestions = aiService.suggestCloze(data.text);
    
    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cards/:id/improvements
 * Get improvement suggestions for a card
 */
router.post('/:id/improvements', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const card = await cardService.getCardById(req.user!.id, req.params.id);
    
    if (!card) {
      res.status(404).json({
        success: false,
        error: 'Card not found',
      });
      return;
    }
    
    const suggestions = aiService.suggestCardImprovements(card.front, card.back, card.type);
    
    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
