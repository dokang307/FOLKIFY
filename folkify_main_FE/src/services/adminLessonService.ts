/**
 * Admin Lesson Service
 * Handles API calls for lesson management in admin dashboard
 */

import { api } from "../config/api";
import type {
  Lesson,
  LessonFormData,
  ApiSuccessResponse,
  PaginationData,
  LessonFilters,
} from "../types/admin";
import { ADMIN_API_ENDPOINTS } from "../constants/admin";

export interface GetLessonsParams {
  page?: number;
  limit?: number;
  instrumentId?: string;
  status?: "draft" | "published";
  level?: "beginner" | "intermediate" | "advanced";
  sort?: "title" | "created_at" | "order_index";
}

export const adminLessonService = {
  /**
   * Get paginated list of lessons with filters
   */
  async getLessons(
    params: GetLessonsParams = {},
  ): Promise<ApiSuccessResponse<Lesson[]>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.instrumentId)
      queryParams.append("instrumentId", params.instrumentId);
    if (params.status) queryParams.append("status", params.status);
    if (params.level) queryParams.append("level", params.level);
    if (params.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${ADMIN_API_ENDPOINTS.LESSONS}?${queryString}`
      : ADMIN_API_ENDPOINTS.LESSONS;

    return api.get<ApiSuccessResponse<Lesson[]>>(endpoint);
  },

  /**
   * Get single lesson by ID
   */
  async getLessonById(id: string): Promise<ApiSuccessResponse<Lesson>> {
    return api.get<ApiSuccessResponse<Lesson>>(
      ADMIN_API_ENDPOINTS.LESSON_BY_ID(id),
    );
  },

  /**
   * Create new lesson
   */
  async createLesson(
    data: LessonFormData,
  ): Promise<ApiSuccessResponse<Lesson>> {
    return api.post<ApiSuccessResponse<Lesson>>(
      ADMIN_API_ENDPOINTS.LESSONS,
      data,
    );
  },

  /**
   * Update existing lesson
   */
  async updateLesson(
    id: string,
    data: Partial<LessonFormData>,
  ): Promise<ApiSuccessResponse<Lesson>> {
    return api.put<ApiSuccessResponse<Lesson>>(
      ADMIN_API_ENDPOINTS.LESSON_BY_ID(id),
      data,
    );
  },

  /**
   * Delete lesson
   */
  async deleteLesson(id: string): Promise<ApiSuccessResponse<void>> {
    return api.delete<ApiSuccessResponse<void>>(
      ADMIN_API_ENDPOINTS.LESSON_BY_ID(id),
    );
  },

  /**
   * Publish or unpublish lesson
   */
  async publishLesson(
    id: string,
    publish: boolean,
  ): Promise<ApiSuccessResponse<Lesson>> {
    return api.put<ApiSuccessResponse<Lesson>>(
      ADMIN_API_ENDPOINTS.LESSON_PUBLISH(id),
      { publish },
    );
  },

  /**
   * Reorder lessons
   */
  async reorderLessons(lessonIds: string[]): Promise<ApiSuccessResponse<void>> {
    return api.put<ApiSuccessResponse<void>>(
      ADMIN_API_ENDPOINTS.LESSON_REORDER,
      { lessonIds },
    );
  },

  /**
   * Upload video for lesson
   */
  async uploadVideo(
    id: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ApiSuccessResponse<{ videoUrl: string }>> {
    const formData = new FormData();
    formData.append("video", file);

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error("Invalid response format"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || `HTTP ${xhr.status}`));
          } catch {
            reject(new Error(`HTTP ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        reject(new Error("Network error"));
      });

      // Get auth token
      const token = localStorage.getItem("folkify_token");

      // Open and send request
      xhr.open(
        "POST",
        `${api["baseURL"]}${ADMIN_API_ENDPOINTS.LESSON_UPLOAD_VIDEO(id)}`,
      );
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  },

  /**
   * Upload sheet music for lesson
   */
  async uploadSheetMusic(
    id: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ApiSuccessResponse<{ sheetMusicUrl: string }>> {
    const formData = new FormData();
    formData.append("sheet", file);

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error("Invalid response format"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || `HTTP ${xhr.status}`));
          } catch {
            reject(new Error(`HTTP ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        reject(new Error("Network error"));
      });

      // Get auth token
      const token = localStorage.getItem("folkify_token");

      // Open and send request
      xhr.open(
        "POST",
        `${api["baseURL"]}${ADMIN_API_ENDPOINTS.LESSON_UPLOAD_SHEET(id)}`,
      );
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  },
};
