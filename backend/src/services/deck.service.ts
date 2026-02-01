import prisma from '../lib/prisma.js';
import type { Deck, Card, CardType } from '@prisma/client';

export interface CreateDeckInput {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateDeckInput {
  name?: string;
  description?: string | null;
  parentId?: string | null;
}

export interface DeckWithStats extends Deck {
  cardCount: number;
  dueCount: number;
  newCount: number;
  children?: DeckWithStats[];
}

/**
 * Create a new deck
 */
export async function createDeck(userId: string, input: CreateDeckInput): Promise<Deck> {
  // If parentId is provided, verify it belongs to the user
  if (input.parentId) {
    const parentDeck = await prisma.deck.findFirst({
      where: { id: input.parentId, userId },
    });
    
    if (!parentDeck) {
      throw new Error('Parent deck not found');
    }
  }
  
  return prisma.deck.create({
    data: {
      name: input.name,
      description: input.description,
      userId,
      parentId: input.parentId,
    },
  });
}

/**
 * Get all decks for a user with statistics
 */
export async function getDecksWithStats(userId: string): Promise<DeckWithStats[]> {
  const decks = await prisma.deck.findMany({
    where: { userId },
    include: {
      cards: {
        select: {
          id: true,
          nextReviewAt: true,
          repetitions: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
  
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  
  const decksWithStats: DeckWithStats[] = decks.map((deck) => {
    const cardCount = deck.cards.length;
    const dueCount = deck.cards.filter((c) => c.nextReviewAt <= now && c.repetitions > 0).length;
    const newCount = deck.cards.filter((c) => c.repetitions === 0).length;
    
    const { cards: _, ...deckData } = deck;
    
    return {
      ...deckData,
      cardCount,
      dueCount,
      newCount,
    };
  });
  
  // Build hierarchical structure
  return buildDeckHierarchy(decksWithStats);
}

/**
 * Build hierarchical deck structure
 */
function buildDeckHierarchy(decks: DeckWithStats[]): DeckWithStats[] {
  const deckMap = new Map<string, DeckWithStats>();
  const rootDecks: DeckWithStats[] = [];
  
  // First pass: create map
  decks.forEach((deck) => {
    deckMap.set(deck.id, { ...deck, children: [] });
  });
  
  // Second pass: build hierarchy
  decks.forEach((deck) => {
    const deckWithChildren = deckMap.get(deck.id)!;
    
    if (deck.parentId && deckMap.has(deck.parentId)) {
      const parent = deckMap.get(deck.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(deckWithChildren);
    } else {
      rootDecks.push(deckWithChildren);
    }
  });
  
  return rootDecks;
}

/**
 * Get a single deck by ID
 */
export async function getDeckById(userId: string, deckId: string): Promise<Deck | null> {
  return prisma.deck.findFirst({
    where: { id: deckId, userId },
    include: {
      parent: true,
      children: true,
    },
  });
}

/**
 * Update a deck
 */
export async function updateDeck(
  userId: string,
  deckId: string,
  input: UpdateDeckInput
): Promise<Deck> {
  // Verify deck belongs to user
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId },
  });
  
  if (!deck) {
    throw new Error('Deck not found');
  }
  
  // If changing parent, verify new parent belongs to user
  if (input.parentId) {
    const parentDeck = await prisma.deck.findFirst({
      where: { id: input.parentId, userId },
    });
    
    if (!parentDeck) {
      throw new Error('Parent deck not found');
    }
    
    // Prevent circular references
    if (input.parentId === deckId) {
      throw new Error('A deck cannot be its own parent');
    }
  }
  
  return prisma.deck.update({
    where: { id: deckId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.parentId !== undefined && { parentId: input.parentId }),
    },
  });
}

/**
 * Delete a deck and all its contents
 */
export async function deleteDeck(userId: string, deckId: string): Promise<void> {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId },
  });
  
  if (!deck) {
    throw new Error('Deck not found');
  }
  
  await prisma.deck.delete({
    where: { id: deckId },
  });
}

/**
 * Get all cards in a deck (including sub-decks)
 */
export async function getDeckCards(
  userId: string,
  deckId: string,
  includeSubDecks = false
): Promise<Card[]> {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId },
  });
  
  if (!deck) {
    throw new Error('Deck not found');
  }
  
  if (includeSubDecks) {
    const deckIds = await getSubDeckIds(deckId);
    deckIds.push(deckId);
    
    return prisma.card.findMany({
      where: { deckId: { in: deckIds } },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  return prisma.card.findMany({
    where: { deckId },
    include: { tags: { include: { tag: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all sub-deck IDs recursively
 */
async function getSubDeckIds(parentId: string): Promise<string[]> {
  const children = await prisma.deck.findMany({
    where: { parentId },
    select: { id: true },
  });
  
  const ids = children.map((c) => c.id);
  
  for (const child of children) {
    const subIds = await getSubDeckIds(child.id);
    ids.push(...subIds);
  }
  
  return ids;
}

/**
 * Get due cards for study session
 */
export async function getDueCards(
  userId: string,
  deckId: string,
  limit: number,
  includeSubDecks = true
): Promise<Card[]> {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId },
  });
  
  if (!deck) {
    throw new Error('Deck not found');
  }
  
  const deckIds = includeSubDecks ? [...(await getSubDeckIds(deckId)), deckId] : [deckId];
  
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  
  // Get new cards first, then due cards
  const newCards = await prisma.card.findMany({
    where: {
      deckId: { in: deckIds },
      repetitions: 0,
    },
    take: Math.floor(limit / 3), // Up to 1/3 new cards
    orderBy: { createdAt: 'asc' },
  });
  
  const remainingLimit = limit - newCards.length;
  
  const dueCards = await prisma.card.findMany({
    where: {
      deckId: { in: deckIds },
      nextReviewAt: { lte: now },
      repetitions: { gt: 0 },
    },
    take: remainingLimit,
    orderBy: { nextReviewAt: 'asc' },
  });
  
  // Shuffle the combined cards for variety
  const allCards = [...newCards, ...dueCards];
  return shuffleArray(allCards);
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
