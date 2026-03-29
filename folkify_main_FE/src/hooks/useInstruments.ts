/**
 * Hook to load instruments from API
 */

import { useState, useEffect } from "react";
import {
  instrumentService,
  type Instrument,
} from "../services/instrumentService";

export function useInstruments() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInstruments() {
      try {
        setLoading(true);
        const data = await instrumentService.getAll();
        setInstruments(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load instruments:", err);
        setError(err.message || "Không thể tải danh sách nhạc cụ");
        setInstruments([]);
      } finally {
        setLoading(false);
      }
    }

    loadInstruments();
  }, []);

  const refetch = async () => {
    setLoading(true);
    try {
      const data = await instrumentService.getAll();
      setInstruments(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách nhạc cụ");
    } finally {
      setLoading(false);
    }
  };

  return { instruments, loading, error, refetch };
}
