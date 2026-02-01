import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import * as deckService from '../services/deck.service.js';
import * as csvService from '../services/csv.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All deck routes require authentication
router.use(authenticate);

// Validation schemas
const createDeckSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
});

const updateDeckSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().optional().nullable(),
});

/**
 * GET /api/decks
 * Get all decks for the current user with statistics
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const decks = await deckService.getDecksWithStats(req.user!.id);
    
    res.json({
      success: true,
      data: decks,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/decks
 * Create a new deck
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = createDeckSchema.parse(req.body);
    const deck = await deckService.createDeck(req.user!.id, data);
    
    res.status(201).json({
      success: true,
      data: deck,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/decks/:id
 * Get a specific deck
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const deck = await deckService.getDeckById(req.user!.id, req.params.id);
    
    if (!deck) {
      res.status(404).json({
        success: false,
        error: 'Deck not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: deck,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/decks/:id
 * Update a deck
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = updateDeckSchema.parse(req.body);
    const deck = await deckService.updateDeck(req.user!.id, req.params.id, data);
    
    res.json({
      success: true,
      data: deck,
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
 * DELETE /api/decks/:id
 * Delete a deck and all its contents
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    await deckService.deleteDeck(req.user!.id, req.params.id);
    
    res.json({
      success: true,
      message: 'Deck deleted successfully',
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
 * GET /api/decks/:id/cards
 * Get all cards in a deck
 */
router.get('/:id/cards', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const includeSubDecks = req.query.includeSubDecks === 'true';
    const cards = await deckService.getDeckCards(req.user!.id, req.params.id, includeSubDecks);
    
    res.json({
      success: true,
      data: cards,
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
 * GET /api/decks/:id/due
 * Get cards due for review
 */
router.get('/:id/due', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
    const includeSubDecks = req.query.includeSubDecks !== 'false';
    
    const cards = await deckService.getDueCards(req.user!.id, req.params.id, limit, includeSubDecks);
    
    res.json({
      success: true,
      data: cards,
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
 * POST /api/decks/:id/import
 * Import cards from CSV
 */
router.post('/:id/import', upload.single('file'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }
    
    const csvContent = req.file.buffer.toString('utf-8');
    const result = await csvService.importCardsFromCsv(req.user!.id, req.params.id, csvContent);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/decks/:id/export
 * Export cards to CSV
 */
router.get('/:id/export', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const includeSubDecks = req.query.includeSubDecks === 'true';
    const csv = await csvService.exportCardsToCsv(req.user!.id, req.params.id, includeSubDecks);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="deck-export-${req.params.id}.csv"`);
    res.send(csv);
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

export default router;
