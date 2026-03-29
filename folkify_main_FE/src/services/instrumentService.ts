/**
 * Instrument Service
 * Handles instrument-related API calls
 */

import { api } from "../config/api";

export interface Instrument {
  id: string;
  name: string;
  englishName: string;
  region: string;
  category: string;
  description: string;
  origin: string;
  material: string;
  soundRange: string;
  difficulty: number;
  popularity: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  instrumentId: string;
  title: string;
  description: string;
  duration: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  order: number;
  videoUrl?: string;
  content?: string;
  xpReward: number;
  createdAt?: string;
  updatedAt?: string;
}

export const instrumentService = {
  /**
   * Get all instruments
   */
  async getAll(): Promise<Instrument[]> {
    try {
      const response = await api.get<Instrument[]>("/api/instruments", true);
      return response;
    } catch (error) {
      console.error("Failed to fetch instruments:", error);
      return [];
    }
  },

  /**
   * Get instrument by ID
   */
  async getById(id: string): Promise<Instrument | null> {
    try {
      const response = await api.get<Instrument>(
        `/api/instruments/${id}`,
        true,
      );
      return response;
    } catch (error) {
      console.error(`Failed to fetch instrument ${id}:`, error);
      return null;
    }
  },

  /**
   * Get lessons for an instrument
   */
  async getLessons(instrumentId: string): Promise<Lesson[]> {
    try {
      const response = await api.get<Lesson[]>(
        `/api/instruments/${instrumentId}/lessons`,
        true,
      );
      return response;
    } catch (error) {
      console.error(
        `Failed to fetch lessons for instrument ${instrumentId}:`,
        error,
      );
      return [];
    }
  },

  /**
   * Get lesson by ID
   */
  async getLessonById(lessonId: string): Promise<Lesson | null> {
    try {
      const response = await api.get<Lesson>(`/api/lessons/${lessonId}`, true);
      return response;
    } catch (error) {
      console.error(`Failed to fetch lesson ${lessonId}:`, error);
      return null;
    }
  },
};
