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
      const response = await api.post<PracticeSession>("/api/practice/start", {
        lessonId,
        startedAt: new Date().toISOString(),
      });
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
      const response = await api.post<PracticeSession>(`/api/practice/end`, {
        sessionId,
        ...data,
      });
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
      console.log("progressService.getUserStats - calling /api/auth/me...");
      // Get user data with stats from /api/auth/me
      const response = await api.get<any>("/api/auth/me");
      console.log("progressService.getUserStats - response:", response);

      // Response structure: { success: true, data: { user: { ...user, user_stats: {...} } } }
      const user = response.data?.user || response.user;
      const stats = user?.user_stats;

      console.log("progressService.getUserStats - user:", user);
      console.log("progressService.getUserStats - stats:", stats);

      if (!stats) {
        console.warn("No user_stats found in /api/auth/me response");
        return null;
      }

      // Map snake_case to camelCase
      const mappedStats = {
        totalXp: stats.total_xp ?? 0,
        currentStreak: stats.current_streak ?? 0,
        longestStreak: stats.longest_streak ?? 0,
        lessonsCompleted: stats.lessons_completed ?? 0,
        practiceMinutes: stats.total_practice_minutes ?? 0,
        level: stats.level ?? 1,
        totalLessons: stats.total_lessons ?? 0,
        completedLessons: stats.lessons_completed ?? 0,
        progressPercent: stats.progress_percent ?? 0,
      };

      console.log("progressService.getUserStats - mapped stats:", mappedStats);
      return mappedStats;
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

  /**
   * Get recent lessons (in progress)
   */
  async getRecentLessons(limit: number = 5): Promise<any[]> {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>(
        `/api/lessons/recent?limit=${limit}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch recent lessons:", error);
      return [];
    }
  },

  /**
   * Get today's practice time
   */
  async getTodayPracticeTime(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await api.get<{ success: boolean; data: any[] }>(
        `/api/practice/history?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`,
      );

      // Sum up duration_minutes from all sessions today
      const totalMinutes = response.data.reduce(
        (sum: number, session: any) => sum + (session.duration_minutes || 0),
        0,
      );

      return totalMinutes;
    } catch (error) {
      console.error("Failed to fetch today's practice time:", error);
      return 0;
    }
  },
};
