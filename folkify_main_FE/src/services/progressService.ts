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
   */
  async getUserProgress(): Promise<UserProgress[]> {
    try {
      const response = await api.get<UserProgress[]>("/api/progress");
      return response;
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
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats | null> {
    try {
      const response = await api.get<any>("/api/users/stats");
      return {
        totalXp: response.total_xp ?? response.totalXp ?? 0,
        currentStreak: response.current_streak ?? response.currentStreak ?? 0,
        longestStreak: response.longest_streak ?? response.longestStreak ?? 0,
        lessonsCompleted:
          response.lessons_completed ?? response.lessonsCompleted ?? 0,
        practiceMinutes:
          response.total_practice_minutes ?? response.practiceMinutes ?? 0,
        level: response.level ?? 1,
        totalLessons: response.total_lessons ?? response.totalLessons,
        completedLessons:
          response.completed_lessons ?? response.completedLessons,
        progressPercent: response.progress_percent ?? response.progressPercent,
      };
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
      // Fallback: try to get stats from /api/auth/me
      try {
        const meResponse = await api.get<any>("/api/auth/me");
        const stats =
          meResponse?.data?.stats ||
          meResponse?.stats ||
          meResponse?.data?.user?.user_stats ||
          meResponse?.user_stats;
        if (!stats) return null;
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
      } catch {
        return null;
      }
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
