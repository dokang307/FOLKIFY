import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByIdWithStats,
  updateUser,
} from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors';
import logger from '../utils/logger';
import { User, UserStats } from '@prisma/client';

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User & { user_stats: UserStats | null };
}

/**
 * Register a new user
 * Validates input, checks email exists, hashes password, creates user + user_stats
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, password, fullName } = input;

  // Validate input
  if (!email || !email.includes('@')) {
    throw new BadRequestError('Invalid email format', 'INVALID_EMAIL');
  }

  if (!password || password.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters', 'INVALID_PASSWORD');
  }

  if (!fullName || fullName.trim().length === 0) {
    throw new BadRequestError('Full name is required', 'INVALID_FULL_NAME');
  }

  // Check if email already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ConflictError('Email already exists', 'EMAIL_EXISTS');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user with user_stats
  const user = await createUser({
    email,
    password_hash: passwordHash,
    full_name: fullName.trim(),
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  logger.info(`User registered successfully: ${user.email}`);

  return {
    accessToken,
    refreshToken,
    user,
  };
}

/**
 * Login user
 * Finds user, verifies password, updates last_login_at, generates tokens
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;

  // Validate input
  if (!email || !password) {
    throw new BadRequestError('Email and password are required', 'MISSING_CREDENTIALS');
  }

  // Find user by email
  const user = await findUserByEmail(email);
  if (!user) {
    logger.warn(`Failed login attempt for non-existent email: ${email}`);
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Check if user is banned
  if (user.account_status === 'banned') {
    logger.warn(`Banned user attempted login: ${email}`);
    throw new ForbiddenError('Account has been banned', 'ACCOUNT_BANNED');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    logger.warn(`Failed login attempt for ${email}: incorrect password`);
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Update last_login_at
  const updatedUser = await updateUser(user.id, {
    last_login_at: new Date(),
  });

  // Get user with stats
  const userWithStats = await findUserByIdWithStats(updatedUser.id);
  if (!userWithStats) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Generate tokens
  const accessToken = generateAccessToken(updatedUser.id, updatedUser.role);
  const refreshToken = generateRefreshToken(updatedUser.id, updatedUser.role);

  logger.info(`User logged in successfully: ${updatedUser.email}`);

  return {
    accessToken,
    refreshToken,
    user: userWithStats,
  };
}

/**
 * Refresh access token
 * Verifies refresh token, generates new access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required', 'MISSING_REFRESH_TOKEN');
  }

  // Verify refresh token
  const payload = verifyToken(refreshToken);

  // Check token type
  if ('type' in payload && payload.type !== 'refresh') {
    throw new UnauthorizedError('Invalid token type', 'INVALID_TOKEN_TYPE');
  }

  // Find user
  const user = await findUserById(payload.userId);
  if (!user) {
    throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
  }

  // Check if user is still active
  if (user.account_status === 'banned') {
    throw new ForbiddenError('Account has been banned', 'ACCOUNT_BANNED');
  }

  // Generate new access token
  const accessToken = generateAccessToken(user.id, user.role);

  return { accessToken };
}

/**
 * Get current user with stats
 */
export async function getMe(userId: string): Promise<User & { user_stats: UserStats | null }> {
  const user = await findUserByIdWithStats(userId);

  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  return user;
}
