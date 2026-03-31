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
  const [authToken, setAuthToken] = useState(() =>
    localStorage.getItem("folkify_token"),
  );

  useEffect(() => {
    async function loadProgress() {
      // Check current token
      const currentToken = localStorage.getItem("folkify_token");
      setAuthToken(currentToken);

      // Only load if user is authenticated
      if (!currentToken) {
        setLoading(false);
        setStats(null);
        return;
      }

      try {
        setLoading(true);
        console.log("useUserProgress - fetching stats...");
        const [progressData, statsData] = await Promise.all([
          progressService.getUserProgress(),
          progressService.getUserStats(),
        ]);
        console.log("useUserProgress - stats received:", statsData);
        setProgress(progressData);
        setStats(statsData);
        setError(null);
      } catch (err: any) {
        console.error("useUserProgress - Failed to load progress:", err);
        setError(err.message || "Không thể tải tiến độ học tập");
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, [authToken]); // Refetch when token changes

  const refetch = async () => {
    const currentToken = localStorage.getItem("folkify_token");
    if (!currentToken) return;

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
