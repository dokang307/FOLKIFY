/**
 * Hook to load user progress and stats from API
 */

import { useState, useEffect } from "react";
import {
  progressService,
  type UserProgress,
  type UserStats,
} from "../services/progressService";
import { isAuthenticated } from "../app/auth";

export function useUserProgress() {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      // Only load if user is authenticated
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [progressData, statsData] = await Promise.all([
          progressService.getUserProgress(),
          progressService.getUserStats(),
        ]);
        setProgress(progressData);
        setStats(statsData);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load progress:", err);
        setError(err.message || "Không thể tải tiến độ học tập");
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  const refetch = async () => {
    if (!isAuthenticated()) return;

    setLoading(true);
    try {
      const [progressData, statsData] = await Promise.all([
        progressService.getUserProgress(),
        progressService.getUserStats(),
      ]);
      setProgress(progressData);
      setStats(statsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Không thể tải tiến độ học tập");
    } finally {
      setLoading(false);
    }
  };

  return { progress, stats, loading, error, refetch };
}
