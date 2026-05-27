/**
 * Admin Dashboard Constants
 * Shared constants used across admin components
 */

// ============================================================================
// Pagination
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 1;

// ============================================================================
// Auto-refresh Intervals (in milliseconds)
// ============================================================================

export const ANALYTICS_REFRESH_INTERVAL = 60000; // 60 seconds
export const ACTIVITY_LOGS_REFRESH_INTERVAL = 30000; // 30 seconds

// ============================================================================
// Debounce Delays (in milliseconds)
// ============================================================================

export const SEARCH_DEBOUNCE_DELAY = 300;
export const FILTER_DEBOUNCE_DELAY = 300;

// ============================================================================
// Cache Duration (in milliseconds)
// ============================================================================

export const ANALYTICS_CACHE_DURATION = 60000; // 60 seconds

// ============================================================================
// File Upload Limits
// ============================================================================

export const VIDEO_MAX_SIZE_MB = 500;
export const SHEET_MUSIC_MAX_SIZE_MB = 10;

export const VIDEO_ALLOWED_TYPES = ["mp4", "webm", "avi"];
export const SHEET_MUSIC_ALLOWED_TYPES = ["pdf", "png", "jpg", "jpeg"];

// ============================================================================
// Toast Duration (in milliseconds)
// ============================================================================

export const TOAST_DURATION = 3000;

// ============================================================================
// Difficulty Levels
// ============================================================================

export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Cơ bản" },
  { value: "intermediate", label: "Trung bình" },
  { value: "advanced", label: "Nâng cao" },
] as const;

// ============================================================================
// Lesson Status
// ============================================================================

export const LESSON_STATUS = [
  { value: "draft", label: "Nháp" },
  { value: "published", label: "Đã xuất bản" },
] as const;

// ============================================================================
// Sort Options
// ============================================================================

export const LESSON_SORT_OPTIONS = [
  { value: "title", label: "Tiêu đề" },
  { value: "created_at", label: "Ngày tạo" },
  { value: "order_index", label: "Thứ tự" },
] as const;

// ============================================================================
// Action Types
// ============================================================================

export const ACTION_TYPES = [
  { value: "create", label: "Tạo mới" },
  { value: "update", label: "Cập nhật" },
  { value: "delete", label: "Xóa" },
  { value: "publish", label: "Xuất bản" },
  { value: "ban", label: "Cấm" },
  { value: "upgrade", label: "Nâng cấp" },
] as const;

// ============================================================================
// Resource Types
// ============================================================================

export const RESOURCE_TYPES = [
  { value: "lesson", label: "Bài học" },
  { value: "user", label: "Người dùng" },
  { value: "subscription", label: "Đăng ký" },
] as const;

// ============================================================================
// Color Classes (Tailwind CSS)
// ============================================================================

export const COLOR_CLASSES = {
  green: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-300",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  gray: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
  },
} as const;

// ============================================================================
// Navigation Routes
// ============================================================================

export const ADMIN_ROUTES = {
  DASHBOARD: "/admin",
  LESSONS: "/admin/lessons",
  LESSONS_CREATE: "/admin/lessons/create",
  LESSONS_EDIT: (id: string) => `/admin/lessons/${id}/edit`,
  ANALYTICS: "/admin/analytics",
  ACTIVITY_LOGS: "/admin/activity-logs",
} as const;

// ============================================================================
// API Endpoints
// ============================================================================

export const ADMIN_API_ENDPOINTS = {
  // Lessons
  LESSONS: "/api/admin/lessons",
  LESSON_BY_ID: (id: string) => `/api/admin/lessons/${id}`,
  LESSON_PUBLISH: (id: string) => `/api/admin/lessons/${id}/publish`,
  LESSON_REORDER: "/api/admin/lessons/reorder",
  LESSON_UPLOAD_VIDEO: (id: string) => `/api/admin/lessons/${id}/upload-video`,
  LESSON_UPLOAD_SHEET: (id: string) => `/api/admin/lessons/${id}/upload-sheet`,

  // Analytics
  ANALYTICS_USERS: "/api/admin/analytics/users",
  ANALYTICS_REVENUE: "/api/admin/analytics/revenue",
  ANALYTICS_AI_GRADING: "/api/admin/analytics/ai-grading",
  ANALYTICS_REVENUE_REPORT: "/api/admin/analytics/revenue-report",
  ANALYTICS_USERS_EXPIRING: "/api/admin/analytics/users-expiring",

  // Activity Logs
  ACTIVITY_LOGS: "/api/admin/activity-logs",
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Lỗi mạng. Vui lòng kiểm tra kết nối của bạn.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  FORBIDDEN: "Bạn không có quyền thực hiện hành động này.",
  NOT_FOUND: "Không tìm thấy tài nguyên.",
  SERVER_ERROR: "Lỗi máy chủ. Vui lòng thử lại sau.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  LESSON_CREATED: "Tạo bài học thành công",
  LESSON_UPDATED: "Cập nhật bài học thành công",
  LESSON_DELETED: "Xóa bài học thành công",
  LESSON_PUBLISHED: "Xuất bản bài học thành công",
  LESSON_UNPUBLISHED: "Hủy xuất bản bài học thành công",
  VIDEO_UPLOADED: "Tải video lên thành công",
  SHEET_UPLOADED: "Tải sheet nhạc lên thành công",
} as const;
