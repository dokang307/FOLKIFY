import { prisma } from '../config/database';
import { getLessonById } from '../repositories/lesson.repository';
import { findUserById } from '../repositories/user.repository';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';
import { User, Lesson, Instrument } from '@prisma/client';

/**
 * Check if user can access a lesson
 * @param user - User object
 * @param lesson - Lesson object
 * @returns true if user has access
 */
export function canAccessLesson(user: User, lesson: Lesson): boolean {
  // Free lessons are accessible to everyone
  if (!lesson.is_premium) {
    return true;
  }

  // Free users can only access first 3 lessons (order_index < 3)
  if (user.account_type === 'free') {
    return lesson.order_index < 3;
  }

  // Check if premium is active
  const isPremium =
    (user.account_type === 'basic' || user.account_type === 'pro') &&
    user.premium_expires_at !== null &&
    user.premium_expires_at > new Date();

  return isPremium;
}

/**
 * Get lesson with access control
 * @param lessonId - Lesson ID
 * @param userId - User ID
 * @returns Lesson with access flags and progress
 */
export async function getLessonWithAccess(
  lessonId: string,
  userId: string
): Promise<
  Lesson & {
    instrument: Instrument;
    has_access: boolean;
    requires_premium: boolean;
    completed: boolean;
    progress_percentage: number;
  }
> {
  // Get lesson
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    throw new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND');
  }

  // Get user
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Check access
  const hasAccess = canAccessLesson(user, lesson);

  // Get user progress
  const progress = await prisma.userProgress.findUnique({
    where: {
      user_id_lesson_id: {
        user_id: userId,
        lesson_id: lessonId,
      },
    },
  });

  return {
    ...lesson,
    has_access: hasAccess,
    requires_premium: !hasAccess && lesson.is_premium,
    completed: progress?.completed || false,
    progress_percentage: progress?.progress_percentage || 0,
  };
}

/**
 * Complete a lesson
 * @param lessonId - Lesson ID
 * @param userId - User ID
 * @returns XP earned and level info
 */
export async function completeLesson(
  lessonId: string,
  userId: string
): Promise<{
  xp_earned: number;
  new_total_xp: number;
  new_level: number;
  level_up: boolean;
}> {
  return prisma.$transaction(async (tx) => {
    // Get lesson
    const lesson = await tx.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND');
    }

    // Get user
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // Check access
    if (!canAccessLesson(user, lesson)) {
      throw new ForbiddenError(
        'You do not have access to this lesson. Upgrade to premium.',
        'LESSON_ACCESS_DENIED'
      );
    }

    // Check if already completed
    const existingProgress = await tx.userProgress.findUnique({
      where: {
        user_id_lesson_id: {
          user_id: userId,
          lesson_id: lessonId,
        },
      },
    });

    // If already completed, don't award XP again
    if (existingProgress?.completed) {
      const stats = await tx.userStats.findUnique({
        where: { user_id: userId },
      });

      return {
        xp_earned: 0,
        new_total_xp: stats?.total_xp || 0,
        new_level: stats?.level || 1,
        level_up: false,
      };
    }

    // Upsert user_progress
    await tx.userProgress.upsert({
      where: {
        user_id_lesson_id: {
          user_id: userId,
          lesson_id: lessonId,
        },
      },
      update: {
        completed: true,
        progress_percentage: 100,
        completed_at: new Date(),
      },
      create: {
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        progress_percentage: 100,
        completed_at: new Date(),
      },
    });

    // Get current stats
    const stats = await tx.userStats.findUnique({
      where: { user_id: userId },
    });

    if (!stats) {
      throw new NotFoundError('User stats not found', 'USER_STATS_NOT_FOUND');
    }

    // Calculate new XP and level
    const newTotalXp = stats.total_xp + lesson.xp;
    const newLevel = Math.floor(newTotalXp / 1000) + 1;
    const levelUp = newLevel > stats.level;

    // Update user_stats
    await tx.userStats.update({
      where: { user_id: userId },
      data: {
        total_xp: newTotalXp,
        level: newLevel,
        lessons_completed: { increment: 1 },
      },
    });

    logger.info(`User ${userId} completed lesson ${lessonId}, earned ${lesson.xp} XP`);

    return {
      xp_earned: lesson.xp,
      new_total_xp: newTotalXp,
      new_level: newLevel,
      level_up: levelUp,
    };
  });
}
