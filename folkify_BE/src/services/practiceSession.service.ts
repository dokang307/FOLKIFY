import { prisma } from '../config/database';
import { createSession, getSessionHistory } from '../repositories/practiceSession.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Start a new practice session
 * @param userId - User ID
 * @param lessonId - Optional lesson ID
 * @param instrumentId - Optional instrument ID
 * @returns Created practice session
 */
export async function startPracticeSession(
  userId: string,
  lessonId?: string,
  instrumentId?: string
): Promise<{ sessionId: string; startedAt: Date }> {
  const session = await createSession({
    user: { connect: { id: userId } },
    lesson: lessonId ? { connect: { id: lessonId } } : undefined,
    instrument: instrumentId ? { connect: { id: instrumentId } } : undefined,
    started_at: new Date(),
    status: 'active',
  });

  logger.info(`Practice session started for user ${userId}`);

  return {
    sessionId: session.id,
    startedAt: session.started_at,
  };
}

/**
 * End a practice session
 * @param sessionId - Practice session ID
 * @param userId - User ID
 * @returns Session results with XP and streak info
 */
export async function endPracticeSession(
  sessionId: string,
  userId: string
): Promise<{
  durationMinutes: number;
  xpEarned: number;
  newTotalXp: number;
  newLevel: number;
  currentStreak: number;
}> {
  return prisma.$transaction(async (tx) => {
    // 1. Get session
    const session = await tx.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundError('Practice session not found', 'SESSION_NOT_FOUND');
    }

    if (session.user_id !== userId) {
      throw new ForbiddenError('Not authorized to end this session', 'UNAUTHORIZED');
    }

    if (session.status !== 'active') {
      throw new BadRequestError('Session is not active', 'SESSION_NOT_ACTIVE');
    }

    // 2. Calculate duration
    const endedAt = new Date();
    const durationMs = endedAt.getTime() - session.started_at.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);

    // Validate max 8 hours (480 minutes)
    if (durationMinutes > 480) {
      throw new BadRequestError('Session too long (max 8 hours)', 'SESSION_TOO_LONG');
    }

    // Ensure minimum 1 minute
    const validDuration = Math.max(1, durationMinutes);

    // 3. Update session
    await tx.practiceSession.update({
      where: { id: sessionId },
      data: {
        ended_at: endedAt,
        duration_minutes: validDuration,
        xp_earned: validDuration, // 1 XP per minute
        status: 'completed',
      },
    });

    // 4. Get current user stats
    const stats = await tx.userStats.findUnique({
      where: { user_id: userId },
    });

    if (!stats) {
      throw new NotFoundError('User stats not found', 'USER_STATS_NOT_FOUND');
    }

    // 5. Calculate new XP and level
    const newTotalXp = stats.total_xp + validDuration;
    const newLevel = Math.floor(newTotalXp / 1000) + 1;

    // 6. Calculate streak
    const currentStreak = await calculateStreak(userId, endedAt, tx);

    // 7. Update longest streak if needed
    const longestStreak = Math.max(stats.longest_streak, currentStreak);

    // 8. Update user_stats
    await tx.userStats.update({
      where: { user_id: userId },
      data: {
        total_xp: newTotalXp,
        level: newLevel,
        total_practice_minutes: { increment: validDuration },
        current_streak: currentStreak,
        longest_streak: longestStreak,
      },
    });

    logger.info(
      `Practice session ${sessionId} ended: ${validDuration} minutes, ${validDuration} XP earned`
    );

    return {
      durationMinutes: validDuration,
      xpEarned: validDuration,
      newTotalXp,
      newLevel,
      currentStreak,
    };
  });
}

/**
 * Calculate user's current streak
 * @param userId - User ID
 * @param currentSessionEnd - Current session end time
 * @param tx - Prisma transaction client
 * @returns Current streak count
 */
export async function calculateStreak(
  userId: string,
  currentSessionEnd: Date,
  tx: any
): Promise<number> {
  // Get the last completed practice session (excluding current one)
  const lastPractice = await tx.practiceSession.findFirst({
    where: {
      user_id: userId,
      status: 'completed',
      ended_at: { not: null },
    },
    orderBy: { ended_at: 'desc' },
  });

  // If no previous practice, streak is 1
  if (!lastPractice || !lastPractice.ended_at) {
    return 1;
  }

  // Calculate hours since last practice
  const hoursSinceLastPractice =
    (currentSessionEnd.getTime() - lastPractice.ended_at.getTime()) / (1000 * 60 * 60);

  // Get current stats to check existing streak
  const stats = await tx.userStats.findUnique({
    where: { user_id: userId },
  });

  // If last practice was within 24 hours, increment streak
  if (hoursSinceLastPractice <= 24) {
    return (stats?.current_streak || 0) + 1;
  }

  // Otherwise, reset streak to 1
  return 1;
}

/**
 * Get practice session history
 * @param userId - User ID
 * @param options - Filter and pagination options
 * @returns Practice sessions with pagination
 */
export async function getPracticeHistory(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  sessions: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const { page = 1, limit = 20 } = options;

  const { sessions, total } = await getSessionHistory(userId, options);

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
