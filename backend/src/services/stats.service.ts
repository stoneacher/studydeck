import prisma from '../lib/prisma';

export interface UserStats {
  totalDecks: number;
  totalCards: number;
  cardsDueToday: number;
  cardsStudiedToday: number;
  cardsStudiedThisWeek: number;
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
  averageRetention: number;
  studyTimeToday: number; // in minutes (estimated)
  recentActivity: DailyActivity[];
}

export interface DailyActivity {
  date: string;
  cardsStudied: number;
  averageQuality: number;
}

export interface DeckStats {
  deckId: string;
  deckName: string;
  totalCards: number;
  newCards: number;
  learningCards: number;
  matureCards: number;
  dueCards: number;
  averageEaseFactor: number;
  retentionRate: number;
}

export const statsService = {
  async getUserStats(userId: string): Promise<UserStats> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    // Get basic counts
    const [totalDecks, totalCards, cardsDueToday] = await Promise.all([
      prisma.deck.count({ where: { userId } }),
      prisma.card.count({
        where: { deck: { userId } },
      }),
      prisma.card.count({
        where: {
          deck: { userId },
          nextReviewAt: { lte: now },
        },
      }),
    ]);

    // Get review stats
    const [reviewsToday, reviewsThisWeek, totalReviews] = await Promise.all([
      prisma.cardReview.count({
        where: {
          session: { userId },
          reviewedAt: { gte: startOfToday },
        },
      }),
      prisma.cardReview.count({
        where: {
          session: { userId },
          reviewedAt: { gte: startOfWeek },
        },
      }),
      prisma.cardReview.count({
        where: { session: { userId } },
      }),
    ]);

    // Calculate average retention (quality >= 3 is considered "remembered")
    const retentionStats = await prisma.cardReview.aggregate({
      where: { session: { userId } },
      _avg: { quality: true },
      _count: true,
    });

    const successfulReviews = await prisma.cardReview.count({
      where: {
        session: { userId },
        quality: { gte: 3 },
      },
    });

    const averageRetention = totalReviews > 0 
      ? Math.round((successfulReviews / totalReviews) * 100) 
      : 0;

    // Calculate study streak
    const { currentStreak, longestStreak } = await this.calculateStreaks(userId);

    // Get recent activity (last 7 days)
    const recentActivity = await this.getRecentActivity(userId, 7);

    // Estimate study time (assume ~10 seconds per review)
    const studyTimeToday = Math.round((reviewsToday * 10) / 60);

    return {
      totalDecks,
      totalCards,
      cardsDueToday,
      cardsStudiedToday: reviewsToday,
      cardsStudiedThisWeek: reviewsThisWeek,
      currentStreak,
      longestStreak,
      totalReviews,
      averageRetention,
      studyTimeToday,
      recentActivity,
    };
  },

  async calculateStreaks(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    // Get all unique study dates
    const sessions = await prisma.studySession.findMany({
      where: { userId },
      select: { startedAt: true },
      orderBy: { startedAt: 'desc' },
    });

    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Get unique dates (as YYYY-MM-DD strings)
    const uniqueDates = [...new Set(
      sessions.map(s => s.startedAt.toISOString().split('T')[0])
    )].sort().reverse();

    if (uniqueDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Check if streak is active (studied today or yesterday)
    const streakActive = uniqueDates[0] === today || uniqueDates[0] === yesterday;

    if (streakActive) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { currentStreak, longestStreak };
  },

  async getRecentActivity(userId: string, days: number): Promise<DailyActivity[]> {
    const activity: DailyActivity[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const reviews = await prisma.cardReview.findMany({
        where: {
          session: { userId },
          reviewedAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        select: { quality: true },
      });

      activity.push({
        date: dateStr,
        cardsStudied: reviews.length,
        averageQuality: reviews.length > 0
          ? Math.round((reviews.reduce((sum, r) => sum + r.quality, 0) / reviews.length) * 10) / 10
          : 0,
      });
    }

    return activity.reverse();
  },

  async getDeckStats(userId: string, deckId: string): Promise<DeckStats | null> {
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId },
      include: {
        cards: {
          select: {
            id: true,
            repetitions: true,
            interval: true,
            easeFactor: true,
            nextReviewAt: true,
          },
        },
      },
    });

    if (!deck) return null;

    const now = new Date();
    const cards = deck.cards;

    // Categorize cards
    const newCards = cards.filter(c => c.repetitions === 0).length;
    const learningCards = cards.filter(c => c.repetitions > 0 && c.interval < 21).length;
    const matureCards = cards.filter(c => c.interval >= 21).length;
    const dueCards = cards.filter(c => c.nextReviewAt <= now).length;

    // Average ease factor
    const avgEase = cards.length > 0
      ? cards.reduce((sum, c) => sum + c.easeFactor, 0) / cards.length
      : 2.5;

    // Get retention rate for this deck
    const deckReviews = await prisma.cardReview.findMany({
      where: {
        card: { deckId },
      },
      select: { quality: true },
    });

    const successfulDeckReviews = deckReviews.filter(r => r.quality >= 3).length;
    const retentionRate = deckReviews.length > 0
      ? Math.round((successfulDeckReviews / deckReviews.length) * 100)
      : 0;

    return {
      deckId: deck.id,
      deckName: deck.name,
      totalCards: cards.length,
      newCards,
      learningCards,
      matureCards,
      dueCards,
      averageEaseFactor: Math.round(avgEase * 100) / 100,
      retentionRate,
    };
  },

  async getAllDeckStats(userId: string): Promise<DeckStats[]> {
    const decks = await prisma.deck.findMany({
      where: { userId },
      select: { id: true },
    });

    const stats: DeckStats[] = [];
    for (const deck of decks) {
      const deckStats = await this.getDeckStats(userId, deck.id);
      if (deckStats) {
        stats.push(deckStats);
      }
    }

    return stats;
  },
};
