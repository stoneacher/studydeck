/**
 * AI Service - Local/Modular AI Features
 * 
 * This module provides AI-assisted features for flashcard generation.
 * Currently uses rule-based approaches that work locally.
 * Designed to be easily replaceable with more sophisticated AI later.
 */

export interface GeneratedCard {
  front: string;
  back: string;
  type: 'BASIC' | 'CLOZE';
}

export interface ClozeSuggestion {
  original: string;
  clozeText: string;
  hiddenWord: string;
}

/**
 * Common words to exclude from cloze deletion suggestions
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this',
  'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'he', 'she', 'his', 'her', 'him', 'we', 'us', 'our', 'you', 'your',
  'i', 'my', 'me', 'as', 'if', 'when', 'than', 'because', 'while',
  'where', 'which', 'who', 'whom', 'whose', 'what', 'how', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'not', 'only', 'same', 'so', 'just', 'also', 'very',
]);

/**
 * Extract key terms from text based on simple heuristics
 * - Capitalized words (likely proper nouns or important terms)
 * - Longer words (typically more meaningful)
 * - Numbers and dates
 */
function extractKeyTerms(text: string): string[] {
  const words = text.match(/\b[\w'-]+\b/g) || [];
  const terms: string[] = [];
  
  words.forEach((word) => {
    const lower = word.toLowerCase();
    
    // Skip stop words
    if (STOP_WORDS.has(lower)) return;
    
    // Skip very short words
    if (word.length < 3) return;
    
    // Include if:
    // - Contains numbers (dates, years, quantities)
    // - Is capitalized (proper nouns)
    // - Is a longer word (typically important concepts)
    if (/\d/.test(word) || /^[A-Z]/.test(word) || word.length >= 6) {
      terms.push(word);
    }
  });
  
  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Generate cloze deletion suggestions from text
 * Identifies key terms that would make good cloze deletions
 */
export function suggestCloze(text: string): ClozeSuggestion[] {
  const keyTerms = extractKeyTerms(text);
  const suggestions: ClozeSuggestion[] = [];
  
  // Generate up to 5 suggestions
  const termsToUse = keyTerms.slice(0, 5);
  
  termsToUse.forEach((term, index) => {
    const clozeText = text.replace(
      new RegExp(`\\b${escapeRegExp(term)}\\b`, 'g'),
      `{{c${index + 1}::${term}}}`
    );
    
    suggestions.push({
      original: text,
      clozeText,
      hiddenWord: term,
    });
  });
  
  return suggestions;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate flashcards from pasted text
 * Uses simple patterns to extract question-answer pairs
 */
export function generateCardsFromText(text: string): GeneratedCard[] {
  const cards: GeneratedCard[] = [];
  
  // Strategy 1: Look for definition patterns
  // "X is Y" or "X: Y" or "X - Y"
  const definitionPatterns = [
    /^(.+?)\s+is\s+(?:a|an|the)?\s*(.+?)\.?$/gim,
    /^(.+?):\s*(.+?)$/gm,
    /^(.+?)\s+-\s+(.+?)$/gm,
    /^(.+?)\s+refers to\s+(.+?)\.?$/gim,
    /^(.+?)\s+means\s+(.+?)\.?$/gim,
  ];
  
  for (const pattern of definitionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const front = match[1].trim();
      const back = match[2].trim();
      
      // Skip if too short or too long
      if (front.length < 3 || back.length < 3) continue;
      if (front.length > 200 || back.length > 500) continue;
      
      cards.push({
        front: `What is ${front.toLowerCase()}?`,
        back: back,
        type: 'BASIC',
      });
    }
  }
  
  // Strategy 2: Split by sentences and create cloze cards
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  
  for (const sentence of sentences.slice(0, 10)) { // Limit to 10 sentences
    const trimmed = sentence.trim();
    const suggestions = suggestCloze(trimmed);
    
    if (suggestions.length > 0) {
      // Take the first suggestion
      cards.push({
        front: suggestions[0].clozeText,
        back: '',
        type: 'CLOZE',
      });
    }
  }
  
  // Strategy 3: Look for Q&A patterns
  const qaPattern = /(?:^|\n)(?:Q:|Question:)\s*(.+?)(?:\n(?:A:|Answer:)\s*(.+?)(?:\n|$))/gi;
  let qaMatch;
  while ((qaMatch = qaPattern.exec(text)) !== null) {
    cards.push({
      front: qaMatch[1].trim(),
      back: qaMatch[2].trim(),
      type: 'BASIC',
    });
  }
  
  // Remove duplicates based on front text
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = card.front.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Suggest improvements to a card
 * Returns suggestions for making the card more effective
 */
export function suggestCardImprovements(
  front: string,
  back: string,
  type: 'BASIC' | 'CLOZE'
): string[] {
  const suggestions: string[] = [];
  
  // Check front side length
  if (front.length > 150) {
    suggestions.push('Consider shortening the question for better recall');
  }
  
  if (front.length < 10 && type === 'BASIC') {
    suggestions.push('The question might be too vague - add more context');
  }
  
  // Check back side
  if (back.length > 300) {
    suggestions.push('Consider breaking this into multiple cards (one concept per card)');
  }
  
  // For basic cards, check if it's a yes/no question
  if (type === 'BASIC' && /^(is|are|do|does|can|will|should|did|was|were)\s/i.test(front)) {
    suggestions.push('Avoid yes/no questions - rephrase to require recall of specific information');
  }
  
  // For cloze, check if there are cloze markers
  if (type === 'CLOZE' && !front.includes('{{c')) {
    suggestions.push('Add cloze markers using {{c1::text}} format');
  }
  
  // Check for passive voice
  if (/was|were|been|being/i.test(front) && type === 'BASIC') {
    suggestions.push('Consider using active voice for clearer questions');
  }
  
  return suggestions;
}

/**
 * Generate multiple cloze cards from a single text
 * Creates separate cards for each important term
 */
export function generateMultipleClozeCards(text: string): GeneratedCard[] {
  const keyTerms = extractKeyTerms(text);
  
  return keyTerms.slice(0, 5).map((term, index) => ({
    front: text.replace(
      new RegExp(`\\b${escapeRegExp(term)}\\b`, 'g'),
      `{{c1::${term}}}`
    ),
    back: '',
    type: 'CLOZE' as const,
  }));
}
