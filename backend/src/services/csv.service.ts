import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import prisma from '../lib/prisma.js';
import type { CardType } from '@prisma/client';
import { createCards } from './card.service.js';

export interface CsvCard {
  front: string;
  back: string;
  type: string;
  notes?: string;
  tags?: string;
}

export interface CsvDeck {
  name: string;
  description?: string;
  parent?: string;
}

export interface ImportResult {
  cardsImported: number;
  decksCreated: number;
  errors: string[];
}

/**
 * Parse CSV content for cards
 */
function parseCsvCards(content: string): CsvCard[] {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
  
  return records.map((record: Record<string, string>) => ({
    front: record.front || record.Front || record.FRONT || '',
    back: record.back || record.Back || record.BACK || '',
    type: record.type || record.Type || record.TYPE || 'BASIC',
    notes: record.notes || record.Notes || record.NOTES,
    tags: record.tags || record.Tags || record.TAGS,
  }));
}

/**
 * Import cards from CSV into a deck
 */
export async function importCardsFromCsv(
  userId: string,
  deckId: string,
  csvContent: string
): Promise<ImportResult> {
  const errors: string[] = [];
  
  // Verify deck belongs to user
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId },
  });
  
  if (!deck) {
    return { cardsImported: 0, decksCreated: 0, errors: ['Deck not found'] };
  }
  
  let cards: CsvCard[];
  try {
    cards = parseCsvCards(csvContent);
  } catch (e) {
    return { 
      cardsImported: 0, 
      decksCreated: 0, 
      errors: ['Failed to parse CSV: ' + (e instanceof Error ? e.message : 'Unknown error')] 
    };
  }
  
  if (cards.length === 0) {
    return { cardsImported: 0, decksCreated: 0, errors: ['No cards found in CSV'] };
  }
  
  // Validate and transform cards
  const validCards: { deckId: string; type: CardType; front: string; back: string; notes?: string; tags?: string[] }[] = [];
  
  cards.forEach((card, index) => {
    if (!card.front || !card.back) {
      errors.push(`Row ${index + 2}: Missing front or back`);
      return;
    }
    
    const cardType = card.type.toUpperCase();
    if (cardType !== 'BASIC' && cardType !== 'CLOZE') {
      errors.push(`Row ${index + 2}: Invalid type "${card.type}", using BASIC`);
    }
    
    validCards.push({
      deckId,
      type: cardType === 'CLOZE' ? 'CLOZE' : 'BASIC',
      front: card.front,
      back: card.back,
      notes: card.notes,
      tags: card.tags ? card.tags.split(',').map((t) => t.trim()) : undefined,
    });
  });
  
  if (validCards.length === 0) {
    return { cardsImported: 0, decksCreated: 0, errors };
  }
  
  const count = await createCards(userId, validCards);
  
  return {
    cardsImported: count,
    decksCreated: 0,
    errors,
  };
}

/**
 * Export cards from a deck to CSV
 */
export async function exportCardsToCsv(
  userId: string,
  deckId: string,
  includeSubDecks = false
): Promise<string> {
  // Verify deck belongs to user
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId },
  });
  
  if (!deck) {
    throw new Error('Deck not found');
  }
  
  // Get deck IDs to export
  let deckIds = [deckId];
  if (includeSubDecks) {
    const allDecks = await getSubDecks(deckId);
    deckIds = [...deckIds, ...allDecks.map((d) => d.id)];
  }
  
  // Get all cards
  const cards = await prisma.card.findMany({
    where: { deckId: { in: deckIds } },
    include: {
      tags: { include: { tag: true } },
      deck: true,
    },
    orderBy: [{ deck: { name: 'asc' } }, { createdAt: 'asc' }],
  });
  
  // Transform to CSV format
  const csvData = cards.map((card) => ({
    front: card.front,
    back: card.back,
    type: card.type,
    notes: card.notes || '',
    tags: card.tags.map((t) => t.tag.name).join(', '),
    deck: card.deck.name,
  }));
  
  return stringify(csvData, {
    header: true,
    columns: ['front', 'back', 'type', 'notes', 'tags', 'deck'],
  });
}

/**
 * Get sub-decks recursively
 */
async function getSubDecks(parentId: string): Promise<{ id: string; name: string }[]> {
  const children = await prisma.deck.findMany({
    where: { parentId },
    select: { id: true, name: true },
  });
  
  const result = [...children];
  
  for (const child of children) {
    const subChildren = await getSubDecks(child.id);
    result.push(...subChildren);
  }
  
  return result;
}

/**
 * Import a complete deck with cards from CSV
 */
export async function importDeckFromCsv(
  userId: string,
  deckName: string,
  csvContent: string,
  parentId?: string
): Promise<ImportResult> {
  // Create the deck first
  const deck = await prisma.deck.create({
    data: {
      name: deckName,
      userId,
      parentId,
    },
  });
  
  // Then import the cards
  const result = await importCardsFromCsv(userId, deck.id, csvContent);
  
  return {
    ...result,
    decksCreated: 1,
  };
}

/**
 * Export entire deck structure with cards
 */
export async function exportDeckWithStructure(
  userId: string,
  deckId: string
): Promise<{ decks: string; cards: string }> {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId },
    include: { children: true },
  });
  
  if (!deck) {
    throw new Error('Deck not found');
  }
  
  // Get all decks in hierarchy
  const allDecks = await getAllDecksInHierarchy(deckId);
  
  const decksCsv = stringify(
    allDecks.map((d) => ({
      name: d.name,
      description: d.description || '',
      parent: d.parentName || '',
    })),
    { header: true, columns: ['name', 'description', 'parent'] }
  );
  
  const cardsCsv = await exportCardsToCsv(userId, deckId, true);
  
  return {
    decks: decksCsv,
    cards: cardsCsv,
  };
}

interface DeckInfo {
  id: string;
  name: string;
  description: string | null;
  parentName: string | null;
}

async function getAllDecksInHierarchy(deckId: string): Promise<DeckInfo[]> {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: { parent: true },
  });
  
  if (!deck) {
    return [];
  }
  
  const result: DeckInfo[] = [{
    id: deck.id,
    name: deck.name,
    description: deck.description,
    parentName: deck.parent?.name || null,
  }];
  
  const children = await prisma.deck.findMany({
    where: { parentId: deckId },
  });
  
  for (const child of children) {
    const childDecks = await getAllDecksInHierarchy(child.id);
    result.push(...childDecks);
  }
  
  return result;
}
