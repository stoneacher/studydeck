import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Validate configuration
validateConfig();

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   📚 StudyDeck API Server                             ║
║                                                       ║
║   Running on: http://localhost:${config.port}                ║
║   Environment: ${config.nodeEnv.padEnd(40)}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
