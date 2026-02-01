import { Router } from 'express';
import type { Response } from 'express';
import { statsService } from '../services/stats.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Get user statistics
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await statsService.getUserStats(req.user!.id);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

// Get all deck statistics
router.get('/decks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await statsService.getAllDeckStats(req.user!.id);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching deck stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deck statistics' });
  }
});

// Get specific deck statistics
router.get('/decks/:deckId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await statsService.getDeckStats(req.user!.id, req.params.deckId);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching deck stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deck statistics' });
  }
});

export default router;
