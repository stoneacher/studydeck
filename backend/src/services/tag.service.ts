import prisma from '../lib/prisma.js';
import type { Tag } from '@prisma/client';

export interface CreateTagInput {
  name: string;
  color?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string | null;
}

/**
 * Get all tags for a user
 */
export async function getTags(userId: string): Promise<Tag[]> {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
}

/**
 * Create a new tag
 */
export async function createTag(userId: string, input: CreateTagInput): Promise<Tag> {
  return prisma.tag.create({
    data: {
      userId,
      name: input.name.trim(),
      color: input.color,
    },
  });
}

/**
 * Update a tag
 */
export async function updateTag(
  userId: string,
  tagId: string,
  input: UpdateTagInput
): Promise<Tag> {
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });
  
  if (!tag) {
    throw new Error('Tag not found');
  }
  
  return prisma.tag.update({
    where: { id: tagId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.color !== undefined && { color: input.color }),
    },
  });
}

/**
 * Delete a tag
 */
export async function deleteTag(userId: string, tagId: string): Promise<void> {
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });
  
  if (!tag) {
    throw new Error('Tag not found');
  }
  
  await prisma.tag.delete({
    where: { id: tagId },
  });
}

/**
 * Get cards with a specific tag
 */
export async function getCardsByTag(userId: string, tagId: string) {
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
    include: {
      cards: {
        include: {
          card: {
            include: {
              deck: true,
            },
          },
        },
      },
    },
  });
  
  if (!tag) {
    throw new Error('Tag not found');
  }
  
  return tag.cards.map((ct) => ct.card);
}
