/**
 * TypeScript Interfaces for Admin Dashboard
 * All data models used in the admin dashboard UI
 */

// ============================================================================
// Lesson Management Types
// ============================================================================

export interface Lesson {
  id: string;
  title: string;
  instrumentId: string;
  instrumentName?: string; // Populated from instrument data
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // minutes
  description: string;
  videoUrl: string | null;
  sheetMusicUrl: string | null;
  xp: number;
  isPremium: boolean;
  status: "draft" | "published";
  orderIndex: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt: string | null; // ISO 8601
}

export interface LessonFormData {
  title: string;
  instrumentId: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // minutes
  description: string;
  videoUrl: string; // YouTube embed URL
  xp: number;
  isPremium: boolean;
  status: "draft" | "published";
}

export interface LessonFilters {
  instrumentId?: string;
  status?: "draft" | "published";
  level?: "beginner" | "intermediate" | "advanced";
}

export interface LessonListState {
  lessons: Lesson[];
  loading: boolean;
  error: string | null;
  pagination: PaginationData;
  filters: LessonFilters;
  sort: "title" | "created_at" | "order_index";
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface UserStatistics {
  total_users: number;
  active_users: number;
  banned_users: number;
  free_users: number;
  basic_users: number;
  pro_users: number;
  new_users_this_month: number;
}

export interface RevenueStatistics {
  total_revenue: number;
  monthly_revenue: number;
  active_subscriptions: number;
  total_transactions: number;
}

export interface AIGradingStatistics {
  total_sessions: number;
  completed_sessions: number;
  pending_sessions: number;
  failed_sessions: number;
  average_score: number;
}

export interface RevenueReportData {
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  transactions: RevenueTransaction[];
  summary: RevenueReportSummary;
}

export interface RevenueTransaction {
  date: string; // ISO 8601
  amount: number;
  planType: "basic" | "pro";
  userId: string;
  userEmail: string;
}

export interface RevenueReportSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
}

export interface ExpiringUser {
  id: string;
  email: string;
  full_name: string;
  account_type: "basic" | "pro";
  premium_expires_at: string; // ISO 8601
  daysUntilExpiration: number;
}

// ============================================================================
// Activity Log Types
// ============================================================================

export interface ActivityLog {
  id: string;
  admin_id: string;
  adminName?: string; // Populated from admin data
  action: "create" | "update" | "delete" | "publish" | "ban" | "upgrade";
  resource_type: "lesson" | "user" | "subscription";
  resource_id: string;
  changes: Record<string, any>; // JSON object
  ip_address?: string;
  user_agent?: string;
  created_at: string; // ISO 8601
}

export interface ActivityLogFilters {
  action?: string;
  resource_type?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ActivityLogListState {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
  pagination: PaginationData;
  filters: ActivityLogFilters;
}

// ============================================================================
// Shared Types
// ============================================================================

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: PaginationData;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface StatisticsCardProps {
  title: string;
  metrics: StatisticsMetric[];
  loading?: boolean;
}

export interface StatisticsMetric {
  label: string;
  value: string | number;
  color?: "green" | "red" | "yellow" | "blue" | "gray";
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export interface LoadingSpinnerProps {
  text?: string;
  size?: "small" | "medium" | "large";
}

export interface FileUploadModalProps {
  lessonId: string;
  uploadType: "video" | "sheet";
  onSuccess: (url: string) => void;
  onClose: () => void;
}

// ============================================================================
// Form Validation Types
// ============================================================================

export interface ValidationRule {
  required?: string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  min?: { value: number; message: string };
  max?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
}

export interface LessonFormValidation {
  title: ValidationRule;
  instrumentId: ValidationRule;
  difficulty: ValidationRule;
  duration: ValidationRule;
  description: ValidationRule;
  videoUrl: ValidationRule;
  xp: ValidationRule;
  isPremium: ValidationRule;
  status: ValidationRule;
}
