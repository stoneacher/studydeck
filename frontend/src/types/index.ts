// API Types - matching backend types

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  cardCount?: number;
  dueCount?: number;
  newCount?: number;
  children?: Deck[];
  parent?: Deck;
}

export type CardType = 'BASIC' | 'CLOZE';

export interface Card {
  id: string;
  deckId: string;
  type: CardType;
  front: string;
  back: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewAt: string | null;
  deck?: Deck;
  tags?: { tag: Tag }[];
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  userId: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  deckId: string;
  startedAt: string;
  endedAt: string | null;
  deck?: Deck;
  reviewCount?: number;
  correctCount?: number;
  averageQuality?: number;
}

export interface StudyStats {
  totalCards: number;
  totalDecks: number;
  totalReviews: number;
  todayReviews: number;
  streak: number;
  dueToday: number;
}

// Extended user statistics
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
  studyTimeToday: number;
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

export interface GeneratedCard {
  front: string;
  back: string;
  type: CardType;
}

export interface ClozeSuggestion {
  original: string;
  clozeText: string;
  hiddenWord: string;
}

export interface ImportResult {
  cardsImported: number;
  decksCreated: number;
  errors: string[];
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Review quality ratings
export enum ReviewQuality {
  COMPLETE_BLACKOUT = 0,
  INCORRECT_REMEMBERED = 1,
  INCORRECT_EASY_RECALL = 2,
  CORRECT_DIFFICULT = 3,
  CORRECT_HESITATION = 4,
  PERFECT = 5,
}
