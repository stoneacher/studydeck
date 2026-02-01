/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * 
 * Based on the SuperMemo 2 algorithm by Piotr Wozniak.
 * This is a proven algorithm used by many flashcard applications.
 * 
 * Quality ratings:
 * 0 - Complete blackout, total failure to recall
 * 1 - Incorrect response, but upon seeing the answer, it felt familiar
 * 2 - Incorrect response, but the correct answer seemed easy to recall
 * 3 - Correct response with serious difficulty
 * 4 - Correct response after a hesitation
 * 5 - Perfect response, immediate recall
 */

export interface SM2Input {
  quality: number;           // 0-5 rating
  repetitions: number;       // Number of successful reviews
  easeFactor: number;        // Current ease factor (minimum 1.3)
  interval: number;          // Current interval in days
}

export interface SM2Result {
  repetitions: number;       // Updated repetition count
  easeFactor: number;        // Updated ease factor
  interval: number;          // New interval in days
  nextReviewDate: Date;      // When to review next
}

/**
 * Minimum ease factor as defined by SM-2
 * Cards shouldn't get harder than this
 */
const MIN_EASE_FACTOR = 1.3;

/**
 * Default ease factor for new cards
 */
export const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Calculate the next review parameters using SM-2 algorithm
 */
export function calculateSM2(input: SM2Input): SM2Result {
  let { quality, repetitions, easeFactor, interval } = input;
  
  // Ensure quality is in valid range
  quality = Math.max(0, Math.min(5, Math.round(quality)));
  
  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  // If quality < 3, reset repetitions (card needs to be relearned)
  if (quality < 3) {
    repetitions = 0;
    interval = 1; // Review again tomorrow
  } else {
    // Successful recall
    repetitions += 1;
    
    if (repetitions === 1) {
      // First successful review: 1 day
      interval = 1;
    } else if (repetitions === 2) {
      // Second successful review: 6 days
      interval = 6;
    } else {
      // Subsequent reviews: multiply by ease factor
      interval = Math.round(interval * newEaseFactor);
    }
  }
  
  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  nextReviewDate.setHours(0, 0, 0, 0); // Start of day
  
  return {
    repetitions,
    easeFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimal places
    interval,
    nextReviewDate,
  };
}

/**
 * Get cards due for review
 * Returns cards where nextReviewAt <= now
 */
export function isDue(nextReviewAt: Date): boolean {
  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today
  return nextReviewAt <= now;
}

/**
 * Calculate how overdue a card is (in days)
 * Positive = overdue, negative = not due yet
 */
export function getOverdueDays(nextReviewAt: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - nextReviewAt.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get a human-readable description of the next review
 */
export function getNextReviewDescription(nextReviewAt: Date): string {
  const now = new Date();
  const diffTime = nextReviewAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return 'Due now';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays < 7) {
    return `In ${diffDays} days`;
  } else if (diffDays < 30) {
    const weeks = Math.round(diffDays / 7);
    return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
  } else if (diffDays < 365) {
    const months = Math.round(diffDays / 30);
    return `In ${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.round(diffDays / 365);
    return `In ${years} year${years > 1 ? 's' : ''}`;
  }
}

/**
 * Predict the next interval for each quality rating
 * Useful for showing users what will happen with each button
 */
export function predictIntervals(input: Omit<SM2Input, 'quality'>): Record<number, number> {
  const predictions: Record<number, number> = {};
  
  for (let q = 0; q <= 5; q++) {
    const result = calculateSM2({ ...input, quality: q });
    predictions[q] = result.interval;
  }
  
  return predictions;
}
