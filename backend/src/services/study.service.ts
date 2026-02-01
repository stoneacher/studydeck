import prisma from '../lib/prisma.js';
import type { StudySession, CardReview } from '@prisma/client';

export interface CreateSessionInput {
  deckId: string;
}

export interface SessionWithStats extends StudySession {
  reviewCount: number;
  correctCount: number;
  averageQuality: number;
}

/**
 * Create a new study session
 */
export async function createSession(
  userId: string,
  input: CreateSessionInput
): Promise<StudySession> {
  // Verify deck belongs to user
  const deck = await prisma.deck.findFirst({
    where: { id: input.deckId, userId },
  });
  
  if (!deck) {
    throw new Error('Deck not found');
  }
  
  return prisma.studySession.create({
    data: {
      userId,
      deckId: input.deckId,
    },
  });
}

/**
 * End a study session
 */
export async function endSession(
  userId: string,
  sessionId: string
): Promise<StudySession> {
  const session = await prisma.studySession.findFirst({
    where: { id: sessionId, userId },
  });
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  return prisma.studySession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });
}

/**
 * Get session with statistics
 */
export async function getSessionWithStats(
  userId: string,
  sessionId: string
): Promise<SessionWithStats | null> {
  const session = await prisma.studySession.findFirst({
    where: { id: sessionId, userId },
    include: {
      reviews: true,
      deck: true,
    },
  });
  
  if (!session) {
    return null;
  }
  
  const reviewCount = session.reviews.length;
  const correctCount = session.reviews.filter((r) => r.quality >= 3).length;
  const averageQuality = reviewCount > 0
    ? session.reviews.reduce((sum, r) => sum + r.quality, 0) / reviewCount
    : 0;
  
  const { reviews: _, ...sessionData } = session;
  
  return {
    ...sessionData,
    reviewCount,
    correctCount,
    averageQuality: Math.round(averageQuality * 100) / 100,
  };
}

/**
 * Get recent sessions for a user
 */
export async function getRecentSessions(
  userId: string,
  limit = 10
): Promise<SessionWithStats[]> {
  const sessions = await prisma.studySession.findMany({
    where: { userId },
    include: {
      reviews: true,
      deck: true,
    },
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
  
  return sessions.map((session) => {
    const reviewCount = session.reviews.length;
    const correctCount = session.reviews.filter((r) => r.quality >= 3).length;
    const averageQuality = reviewCount > 0
      ? session.reviews.reduce((sum, r) => sum + r.quality, 0) / reviewCount
      : 0;
    
    const { reviews: _, ...sessionData } = session;
    
    return {
      ...sessionData,
      reviewCount,
      correctCount,
      averageQuality: Math.round(averageQuality * 100) / 100,
    };
  });
}

/**
 * Get study statistics for a user
 */
export async function getUserStats(userId: string): Promise<{
  totalCards: number;
  totalDecks: number;
  totalReviews: number;
  todayReviews: number;
  streak: number;
  dueToday: number;
}> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);
  
  const [totalCards, totalDecks, totalReviews, todayReviews, dueToday] = await Promise.all([
    prisma.card.count({
      where: { deck: { userId } },
    }),
    prisma.deck.count({
      where: { userId },
    }),
    prisma.cardReview.count({
      where: { session: { userId } },
    }),
    prisma.cardReview.count({
      where: {
        session: { userId },
        reviewedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),
    prisma.card.count({
      where: {
        deck: { userId },
        nextReviewAt: { lte: endOfToday },
      },
    }),
  ]);
  
  // Calculate streak (consecutive days with reviews)
  const streak = await calculateStreak(userId);
  
  return {
    totalCards,
    totalDecks,
    totalReviews,
    todayReviews,
    streak,
    dueToday,
  };
}

/**
 * Calculate study streak
 */
async function calculateStreak(userId: string): Promise<number> {
  const reviews = await prisma.cardReview.findMany({
    where: { session: { userId } },
    select: { reviewedAt: true },
    orderBy: { reviewedAt: 'desc' },
  });
  
  if (reviews.length === 0) {
    return 0;
  }
  
  // Get unique days
  const days = new Set<string>();
  reviews.forEach((r) => {
    const date = r.reviewedAt.toISOString().split('T')[0];
    days.add(date);
  });
  
  const sortedDays = Array.from(days).sort().reverse();
  
  // Check if there's a review today or yesterday
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) {
    return 0;
  }
  
  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const current = new Date(sortedDays[i - 1]);
    const previous = new Date(sortedDays[i]);
    const diffDays = (current.getTime() - previous.getTime()) / 86400000;
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
