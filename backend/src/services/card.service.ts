import prisma from '../lib/prisma.js';
import type { Card, CardType } from '@prisma/client';
import { calculateSM2, DEFAULT_EASE_FACTOR } from './spaced-repetition.service.js';

export interface CreateCardInput {
  deckId: string;
  type: CardType;
  front: string;
  back: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateCardInput {
  type?: CardType;
  front?: string;
  back?: string;
  notes?: string | null;
  deckId?: string;
  tags?: string[];
}

export interface ReviewCardInput {
  quality: number; // 0-5
  sessionId: string;
}

/**
 * Create a new card
 */
export async function createCard(userId: string, input: CreateCardInput): Promise<Card> {
  // Verify deck belongs to user
  const deck = await prisma.deck.findFirst({
    where: { id: input.deckId, userId },
  });
  
  if (!deck) {
    throw new Error('Deck not found');
  }
  
  const card = await prisma.card.create({
    data: {
      deckId: input.deckId,
      type: input.type,
      front: input.front,
      back: input.back,
      notes: input.notes,
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      nextReviewAt: new Date(),
    },
  });
  
  // Handle tags if provided
  if (input.tags && input.tags.length > 0) {
    await attachTags(userId, card.id, input.tags);
  }
  
  return card;
}

/**
 * Create multiple cards at once (for import)
 */
export async function createCards(userId: string, cards: CreateCardInput[]): Promise<number> {
  // Group cards by deck and verify all decks belong to user
  const deckIds = [...new Set(cards.map((c) => c.deckId))];
  
  const decks = await prisma.deck.findMany({
    where: { id: { in: deckIds }, userId },
  });
  
  const validDeckIds = new Set(decks.map((d) => d.id));
  const validCards = cards.filter((c) => validDeckIds.has(c.deckId));
  
  if (validCards.length === 0) {
    throw new Error('No valid decks found');
  }
  
  const result = await prisma.card.createMany({
    data: validCards.map((card) => ({
      deckId: card.deckId,
      type: card.type,
      front: card.front,
      back: card.back,
      notes: card.notes,
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      nextReviewAt: new Date(),
    })),
  });
  
  return result.count;
}

/**
 * Get a card by ID
 */
export async function getCardById(userId: string, cardId: string): Promise<Card | null> {
  return prisma.card.findFirst({
    where: {
      id: cardId,
      deck: { userId },
    },
    include: {
      tags: { include: { tag: true } },
      deck: true,
    },
  });
}

/**
 * Update a card
 */
export async function updateCard(
  userId: string,
  cardId: string,
  input: UpdateCardInput
): Promise<Card> {
  // Verify card belongs to user
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      deck: { userId },
    },
  });
  
  if (!card) {
    throw new Error('Card not found');
  }
  
  // If changing deck, verify new deck belongs to user
  if (input.deckId && input.deckId !== card.deckId) {
    const newDeck = await prisma.deck.findFirst({
      where: { id: input.deckId, userId },
    });
    
    if (!newDeck) {
      throw new Error('Target deck not found');
    }
  }
  
  const updatedCard = await prisma.card.update({
    where: { id: cardId },
    data: {
      ...(input.type !== undefined && { type: input.type }),
      ...(input.front !== undefined && { front: input.front }),
      ...(input.back !== undefined && { back: input.back }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.deckId !== undefined && { deckId: input.deckId }),
    },
  });
  
  // Handle tags if provided
  if (input.tags !== undefined) {
    // Remove existing tags
    await prisma.cardTag.deleteMany({
      where: { cardId },
    });
    
    // Add new tags
    if (input.tags.length > 0) {
      await attachTags(userId, cardId, input.tags);
    }
  }
  
  return updatedCard;
}

/**
 * Delete a card
 */
export async function deleteCard(userId: string, cardId: string): Promise<void> {
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      deck: { userId },
    },
  });
  
  if (!card) {
    throw new Error('Card not found');
  }
  
  await prisma.card.delete({
    where: { id: cardId },
  });
}

/**
 * Review a card (update spaced repetition state)
 */
export async function reviewCard(
  userId: string,
  cardId: string,
  input: ReviewCardInput
): Promise<Card> {
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      deck: { userId },
    },
  });
  
  if (!card) {
    throw new Error('Card not found');
  }
  
  // Calculate new SM-2 values
  const sm2Result = calculateSM2({
    quality: input.quality,
    repetitions: card.repetitions,
    easeFactor: card.easeFactor,
    interval: card.interval,
  });
  
  // Create review record
  await prisma.cardReview.create({
    data: {
      cardId,
      sessionId: input.sessionId,
      quality: input.quality,
      previousInterval: card.interval,
      previousEaseFactor: card.easeFactor,
      newInterval: sm2Result.interval,
      newEaseFactor: sm2Result.easeFactor,
    },
  });
  
  // Update card with new values
  return prisma.card.update({
    where: { id: cardId },
    data: {
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      nextReviewAt: sm2Result.nextReviewDate,
      lastReviewAt: new Date(),
    },
  });
}

/**
 * Reset a card's progress
 */
export async function resetCard(userId: string, cardId: string): Promise<Card> {
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      deck: { userId },
    },
  });
  
  if (!card) {
    throw new Error('Card not found');
  }
  
  return prisma.card.update({
    where: { id: cardId },
    data: {
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      nextReviewAt: new Date(),
      lastReviewAt: null,
    },
  });
}

/**
 * Attach tags to a card, creating them if they don't exist
 */
async function attachTags(userId: string, cardId: string, tagNames: string[]): Promise<void> {
  for (const name of tagNames) {
    // Find or create tag
    let tag = await prisma.tag.findFirst({
      where: { userId, name: name.trim() },
    });
    
    if (!tag) {
      tag = await prisma.tag.create({
        data: { userId, name: name.trim() },
      });
    }
    
    // Create card-tag relation
    await prisma.cardTag.create({
      data: { cardId, tagId: tag.id },
    });
  }
}

/**
 * Parse cloze deletions from text
 * Format: {{c1::hidden text}} or {{c1::hidden text::hint}}
 */
export function parseCloze(text: string): { index: number; hidden: string; hint?: string }[] {
  const regex = /\{\{c(\d+)::([^}:]+)(?:::([^}]+))?\}\}/g;
  const matches: { index: number; hidden: string; hint?: string }[] = [];
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      index: parseInt(match[1], 10),
      hidden: match[2],
      hint: match[3],
    });
  }
  
  return matches;
}

/**
 * Render cloze card for display
 * Replaces {{c1::text}} with [...]
 */
export function renderCloze(
  text: string,
  showIndex?: number
): { question: string; answer: string } {
  const question = text.replace(
    /\{\{c(\d+)::([^}:]+)(?:::([^}]+))?\}\}/g,
    (match, index, hidden, hint) => {
      if (showIndex !== undefined && parseInt(index, 10) === showIndex) {
        return hidden; // Show this cloze
      }
      return hint ? `[${hint}]` : '[...]';
    }
  );
  
  const answer = text.replace(
    /\{\{c\d+::([^}:]+)(?:::[^}]+)?\}\}/g,
    '$1'
  );
  
  return { question, answer };
}
