// Application configuration
// All environment variables are loaded and validated here

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://studydeck:studydeck@localhost:5432/studydeck',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'studydeck-development-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Study settings
  defaultDailyLimit: parseInt(process.env.DEFAULT_DAILY_LIMIT || '50', 10),
  newCardsPerDay: parseInt(process.env.NEW_CARDS_PER_DAY || '20', 10),
} as const;

// Validate required environment variables in production
export function validateConfig(): void {
  if (config.nodeEnv === 'production') {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    if (config.jwtSecret === 'studydeck-development-secret-change-in-production') {
      throw new Error('JWT_SECRET must be changed in production');
    }
  }
}
