/**
 * Form Validation Schemas
 * Validation rules for react-hook-form
 */

import type { LessonFormValidation } from "../types/admin";

/**
 * Lesson Form Validation Schema
 * Used with react-hook-form for lesson create/edit forms
 */
export const lessonFormSchema: LessonFormValidation = {
  title: {
    required: "Title is required",
    minLength: { value: 1, message: "Title must be at least 1 character" },
    maxLength: { value: 200, message: "Title must be at most 200 characters" },
  },
  instrumentId: {
    required: "Instrument is required",
  },
  difficulty: {
    required: "Difficulty is required",
  },
  duration: {
    required: "Duration is required",
    min: { value: 1, message: "Duration must be at least 1 minute" },
  },
  description: {
    required: "Description is required",
    minLength: {
      value: 1,
      message: "Description must be at least 1 character",
    },
    maxLength: {
      value: 2000,
      message: "Description must be at most 2000 characters",
    },
  },
  videoUrl: {
    pattern: {
      value: /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+$/,
      message: "Invalid YouTube embed URL format",
    },
  },
  xp: {
    required: "XP is required",
    min: { value: 0, message: "XP must be a positive number" },
  },
  isPremium: {
    required: "Premium status is required",
  },
  status: {
    required: "Status is required",
  },
};

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate YouTube embed URL format
 */
export function isValidYouTubeEmbedUrl(url: string): boolean {
  if (!url) return true; // Optional field
  const youtubeEmbedRegex =
    /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+$/;
  return youtubeEmbedRegex.test(url);
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  return fileExtension ? allowedTypes.includes(fileExtension) : false;
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Video file validation
 */
export function validateVideoFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ["mp4", "webm", "avi"];
  const maxSizeMB = 500;

  if (!isValidFileType(file, allowedTypes)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (!isValidFileSize(file, maxSizeMB)) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Sheet music file validation
 */
export function validateSheetMusicFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ["pdf", "png", "jpg", "jpeg"];
  const maxSizeMB = 10;

  if (!isValidFileType(file, allowedTypes)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (!isValidFileSize(file, maxSizeMB)) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Date range validation
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date,
): { valid: boolean; error?: string } {
  if (startDate >= endDate) {
    return {
      valid: false,
      error: "Start date must be before end date",
    };
  }

  return { valid: true };
}
