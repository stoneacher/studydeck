import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';
import type { SafeUser, JwtPayload } from '../types/index.js';

const SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with a hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
function generateToken(user: { id: string; email: string }): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };
  
  // Cast to any to handle jsonwebtoken version differences
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as SignOptions);
}

/**
 * Remove sensitive fields from user object
 */
function sanitizeUser(user: { id: string; email: string; name: string | null; createdAt: Date; updatedAt: Date; passwordHash: string }): SafeUser {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Register a new user
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  
  if (existingUser) {
    throw new Error('Email already registered');
  }
  
  // Validate password strength
  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  // Hash password and create user
  const passwordHash = await hashPassword(input.password);
  
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name || null,
    },
  });
  
  const token = generateToken(user);
  
  return {
    user: sanitizeUser(user),
    token,
  };
}

/**
 * Login an existing user
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isValidPassword = await verifyPassword(input.password, user.passwordHash);
  
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }
  
  const token = generateToken(user);
  
  return {
    user: sanitizeUser(user),
    token,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    return null;
  }
  
  return sanitizeUser(user);
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: { name?: string; email?: string }
): Promise<SafeUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email.toLowerCase() }),
    },
  });
  
  return sanitizeUser(user);
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
  
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }
  
  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long');
  }
  
  const passwordHash = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
