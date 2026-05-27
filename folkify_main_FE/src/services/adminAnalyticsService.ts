/**
 * Admin Analytics Service
 * Handles API calls for analytics data in admin dashboard
 */

import { api } from "../config/api";
import type {
  UserStatistics,
  RevenueStatistics,
  AIGradingStatistics,
  RevenueReportData,
  ExpiringUser,
  ApiSuccessResponse,
} from "../types/admin";
import { ADMIN_API_ENDPOINTS } from "../constants/admin";

export interface RevenueReportParams {
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
}

export interface UsersExpiringParams {
  days?: number; // Default 7 days
}

export const adminAnalyticsService = {
  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<ApiSuccessResponse<UserStatistics>> {
    return api.get<ApiSuccessResponse<UserStatistics>>(
      ADMIN_API_ENDPOINTS.ANALYTICS_USERS,
    );
  },

  /**
   * Get revenue statistics
   */
  async getRevenueStatistics(): Promise<ApiSuccessResponse<RevenueStatistics>> {
    return api.get<ApiSuccessResponse<RevenueStatistics>>(
      ADMIN_API_ENDPOINTS.ANALYTICS_REVENUE,
    );
  },

  /**
   * Get AI grading statistics
   */
  async getAIGradingStatistics(): Promise<
    ApiSuccessResponse<AIGradingStatistics>
  > {
    return api.get<ApiSuccessResponse<AIGradingStatistics>>(
      ADMIN_API_ENDPOINTS.ANALYTICS_AI_GRADING,
    );
  },

  /**
   * Generate revenue report for date range
   */
  async getRevenueReport(
    params: RevenueReportParams,
  ): Promise<ApiSuccessResponse<RevenueReportData>> {
    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    });

    return api.get<ApiSuccessResponse<RevenueReportData>>(
      `${ADMIN_API_ENDPOINTS.ANALYTICS_REVENUE_REPORT}?${queryParams.toString()}`,
    );
  },

  /**
   * Get premium users expiring soon
   */
  async getUsersExpiring(
    params: UsersExpiringParams = {},
  ): Promise<ApiSuccessResponse<ExpiringUser[]>> {
    const queryParams = new URLSearchParams();
    if (params.days) {
      queryParams.append("days", params.days.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${ADMIN_API_ENDPOINTS.ANALYTICS_USERS_EXPIRING}?${queryString}`
      : ADMIN_API_ENDPOINTS.ANALYTICS_USERS_EXPIRING;

    return api.get<ApiSuccessResponse<ExpiringUser[]>>(endpoint);
  },
};
