/**
 * Admin Activity Log Service
 * Handles API calls for activity logs in admin dashboard
 */

import { api } from "../config/api";
import type {
  ActivityLog,
  ApiSuccessResponse,
  PaginationData,
} from "../types/admin";
import { ADMIN_API_ENDPOINTS } from "../constants/admin";

export interface ActivityLogParams {
  page?: number;
  limit?: number;
  action?: string;
  resource_type?: string;
  startDate?: string; // ISO 8601 format
  endDate?: string; // ISO 8601 format
}

export interface ActivityLogResponse {
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminActivityLogService = {
  /**
   * Get activity logs with pagination and filters
   */
  async getActivityLogs(
    params: ActivityLogParams = {},
  ): Promise<ApiSuccessResponse<ActivityLogResponse>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.action) queryParams.append("action", params.action);
    if (params.resource_type)
      queryParams.append("resource_type", params.resource_type);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${ADMIN_API_ENDPOINTS.ACTIVITY_LOGS}?${queryString}`
      : ADMIN_API_ENDPOINTS.ACTIVITY_LOGS;

    return api.get<ApiSuccessResponse<ActivityLogResponse>>(endpoint);
  },
};
