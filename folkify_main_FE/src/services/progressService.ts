/**
 * Progress Service
 * Handles user progress and practice sessions
 */

import { api } from "../config/api";

export interface UserProgress {
  userId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  xpEarned: number;
}

export interface PracticeSession {
  id: string;
  userId: string;
  lessonId: string;
  startedAt: string;
  completedAt?: string;
  durationMinutes?: number;
  score?: number;
  notes?: string;
}

export interface UserStats {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  practiceMinutes: number;
  level: number;
  totalLessons?: number;
  completedLessons?: number;
  progressPercent?: number;
}

export const progressService = {
  /**
   * Get user progress for all lessons
   * Note: This endpoint doesn't exist in backend yet
   * For now, we'll get progress from /api/auth/me
   */
  async getUserProgress(): Promise<UserProgress[]> {
    try {
      // TODO: Backend needs to implement /api/progress endpoint
      // For now, return empty array
      return [];
    } catch (error) {
      console.error("Failed to fetch user progress:", error);
      return [];
    }
  },

  /**
   * Mark lesson as completed
   */
  async completeLesson(lessonId: string): Promise<UserProgress | null> {
    try {
      const response = await api.post<UserProgress>(
        `/api/lessons/${lessonId}/complete`,
      );
      return response;
    } catch (error) {
      console.error(`Failed to complete lesson ${lessonId}:`, error);
      return null;
    }
  },

  /**
   * Start a practice session
   */
  async startPracticeSession(
    lessonId: string,
  ): Promise<PracticeSession | null> {
    try {
      const response = await api.post<PracticeSession>(
        "/api/practice-sessions",
        {
          lessonId,
          startedAt: new Date().toISOString(),
        },
      );
      return response;
    } catch (error) {
      console.error("Failed to start practice session:", error);
      return null;
    }
  },

  /**
   * End a practice session
   */
  async endPracticeSession(
    sessionId: string,
    data: {
      completedAt: string;
      durationMinutes: number;
      score?: number;
      notes?: string;
    },
  ): Promise<PracticeSession | null> {
    try {
      const response = await api.put<PracticeSession>(
        `/api/practice-sessions/${sessionId}`,
        data,
      );
      return response;
    } catch (error) {
      console.error("Failed to end practice session:", error);
      return null;
    }
  },

  /**
   * Get user statistics from /api/auth/me
   */
  async getUserStats(): Promise<UserStats | null> {
    try {
      // Get user data with stats from /api/auth/me
      const response = await api.get<any>("/api/auth/me");

      // Response structure: { success: true, data: { user: { ...user, user_stats: {...} } } }
      const user = response.data?.user || response.user;
      const stats = user?.user_stats;

      if (!stats) {
        console.warn("No user_stats found in /api/auth/me response");
        return null;
      }

      // Map snake_case to camelCase
      return {
        totalXp: stats.total_xp ?? 0,
        currentStreak: stats.current_streak ?? 0,
        longestStreak: stats.longest_streak ?? 0,
        lessonsCompleted: stats.lessons_completed ?? 0,
        practiceMinutes: stats.total_practice_minutes ?? 0,
        level: stats.level ?? 1,
        totalLessons: stats.total_lessons,
        completedLessons: stats.completed_lessons,
        progressPercent: stats.progress_percent,
      };
    } catch (error) {
      console.error("Failed to fetch user stats from /api/auth/me:", error);
      return null;
    }
  },

  /**
   * Get practice sessions for a lesson
   */
  async getPracticeSessions(lessonId: string): Promise<PracticeSession[]> {
    try {
      const response = await api.get<PracticeSession[]>(
        `/api/lessons/${lessonId}/practice-sessions`,
      );
      return response;
    } catch (error) {
      console.error(
        `Failed to fetch practice sessions for lesson ${lessonId}:`,
        error,
      );
      return [];
    }
  },
};
