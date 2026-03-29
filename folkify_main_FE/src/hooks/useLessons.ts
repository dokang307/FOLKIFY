/**
 * Hook to load lessons for a specific instrument from API
 */

import { useState, useEffect } from "react";
import { instrumentService, type Lesson } from "../services/instrumentService";

export function useLessons(instrumentId: string | null) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLessons() {
      if (!instrumentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await instrumentService.getLessons(instrumentId);
        setLessons(data);
        setError(null);
      } catch (err: any) {
        console.error(
          `Failed to load lessons for instrument ${instrumentId}:`,
          err,
        );
        setError(err.message || "Không thể tải danh sách bài học");
        setLessons([]);
      } finally {
        setLoading(false);
      }
    }

    loadLessons();
  }, [instrumentId]);

  const refetch = async () => {
    if (!instrumentId) return;

    setLoading(true);
    try {
      const data = await instrumentService.getLessons(instrumentId);
      setLessons(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách bài học");
    } finally {
      setLoading(false);
    }
  };

  return { lessons, loading, error, refetch };
}
