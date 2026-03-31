import apiClient from "../config/api";

// ============= TYPES =============

export interface UserListItem {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  account_type: "free" | "basic" | "pro";
  account_status: "active" | "banned" | "suspended";
  premium_expires_at: string | null;
  created_at: string;
}

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

export interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes: any;
  created_at: string;
}

// ============= API FUNCTIONS =============

export const adminService = {
  // User Management
  async getUsers(filters?: {
    accountType?: "free" | "basic" | "pro";
    accountStatus?: "active" | "banned" | "suspended";
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.accountType) params.append("accountType", filters.accountType);
    if (filters?.accountStatus)
      params.append("accountStatus", filters.accountStatus);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get(
      `/api/admin/users?${params.toString()}`,
    );
    return response.data;
  },

  async getUserDetails(userId: string) {
    const response = await apiClient.get(`/api/admin/users/${userId}`);
    return response.data.user;
  },

  async upgradeUser(
    userId: string,
    planType: "basic" | "pro",
    durationMonths: number,
    notes?: string,
  ) {
    const response = await apiClient.post(
      `/api/admin/users/${userId}/upgrade`,
      {
        planType,
        durationMonths,
        notes,
      },
    );
    return response.data;
  },

  async banUser(userId: string, reason: string) {
    const response = await apiClient.post(`/api/admin/users/${userId}/ban`, {
      reason,
    });
    return response.data;
  },

  async unbanUser(userId: string) {
    const response = await apiClient.post(`/api/admin/users/${userId}/unban`);
    return response.data;
  },

  // Analytics
  async getUserStatistics(): Promise<UserStatistics> {
    const response = await apiClient.get("/api/admin/analytics/users");
    return response.data;
  },

  async getRevenueStatistics(): Promise<RevenueStatistics> {
    const response = await apiClient.get("/api/admin/analytics/revenue");
    return response.data;
  },

  async getAIGradingStatistics(): Promise<AIGradingStatistics> {
    const response = await apiClient.get("/api/admin/analytics/ai-grading");
    return response.data;
  },

  async getUsersExpiringSoon(days: number = 7) {
    const response = await apiClient.get(
      `/api/admin/analytics/users-expiring?days=${days}`,
    );
    return response.data;
  },

  async getRevenueReport(startDate: string, endDate: string) {
    const response = await apiClient.get(
      `/api/admin/analytics/revenue-report?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data;
  },

  // Lesson Management
  async setLessonPremium(lessonId: string, isPremium: boolean) {
    const response = await apiClient.post(
      `/api/admin/lessons/${lessonId}/set-premium`,
      {
        isPremium,
      },
    );
    return response.data;
  },

  async publishLesson(lessonId: string) {
    const response = await apiClient.post(
      `/api/admin/lessons/${lessonId}/publish`,
    );
    return response.data;
  },

  async unpublishLesson(lessonId: string) {
    const response = await apiClient.post(
      `/api/admin/lessons/${lessonId}/unpublish`,
    );
    return response.data;
  },

  // Activity Logs
  async getActivityLogs(filters?: {
    action?: string;
    resource_type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.action) params.append("action", filters.action);
    if (filters?.resource_type)
      params.append("resource_type", filters.resource_type);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get(
      `/api/admin/activity-logs?${params.toString()}`,
    );
    return response.data;
  },

  // Cronjobs
  async triggerCronjob(type: "premium-expiration" | "file-cleanup") {
    const response = await apiClient.post("/api/admin/cronjobs/trigger", {
      type,
    });
    return response.data;
  },
};
