import { Router } from 'express';
import authRoutes from './auth.routes.js';
import deckRoutes from './deck.routes.js';
import cardRoutes from './card.routes.js';
import studyRoutes from './study.routes.js';
import tagRoutes from './tag.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/decks', deckRoutes);
router.use('/cards', cardRoutes);
router.use('/study', studyRoutes);
router.use('/tags', tagRoutes);

export default router;
