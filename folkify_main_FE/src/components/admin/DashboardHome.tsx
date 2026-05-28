/**
 * DashboardHome Component
 *
 * Dashboard overview page displaying user, revenue, and AI grading statistics with quick actions.
 * Features auto-refresh every 60 seconds, manual refresh button, and last refresh timestamp.
 * Uses StatisticsCard components with Vietnamese labels matching backend responses.
 * Includes quick action buttons for navigating to key admin sections.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 9.1, 9.2, 14.1, 14.3, 14.4
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { StatisticsCard } from "./StatisticsCard";
import { LoadingSpinner } from "./LoadingSpinner";
import { adminAnalyticsService } from "../../services/adminAnalyticsService";
import { showErrorToast } from "../../utils/toast";
import {
  formatNumber,
  formatCurrency,
  formatDateTime,
} from "../../utils/format";
import {
  ANALYTICS_REFRESH_INTERVAL,
  ANALYTICS_CACHE_DURATION,
} from "../../constants/admin";
import type {
  UserStatistics,
  RevenueStatistics,
  AIGradingStatistics,
  StatisticsMetric,
} from "../../types/admin";

interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface DashboardData {
  userStats: UserStatistics | null;
  revenueStats: RevenueStatistics | null;
  aiGradingStats: AIGradingStatistics | null;
}

export function DashboardHome() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    userStats: null,
    revenueStats: null,
    aiGradingStats: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Client-side cache (60 seconds)
  const cacheRef = useRef<{
    userStats?: CachedData<UserStatistics>;
    revenueStats?: CachedData<RevenueStatistics>;
    aiGradingStats?: CachedData<AIGradingStatistics>;
  }>({});

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < ANALYTICS_CACHE_DURATION;
  }, []);

  /**
   * Fetch all statistics with caching
   */
  const fetchStatistics = useCallback(
    async (forceRefresh: boolean = false) => {
      const isManualRefresh = forceRefresh;
      if (isManualRefresh) {
        setRefreshing(true);
      } else if (
        !data.userStats &&
        !data.revenueStats &&
        !data.aiGradingStats
      ) {
        setLoading(true);
      }

      try {
        // Fetch user statistics
        let userStats: UserStatistics | null = null;
        if (
          forceRefresh ||
          !cacheRef.current.userStats ||
          !isCacheValid(cacheRef.current.userStats.timestamp)
        ) {
          const userResponse = await adminAnalyticsService.getUserStatistics();
          userStats = userResponse.data;
          cacheRef.current.userStats = {
            data: userStats,
            timestamp: Date.now(),
          };
        } else {
          userStats = cacheRef.current.userStats.data;
        }

        // Fetch revenue statistics
        let revenueStats: RevenueStatistics | null = null;
        if (
          forceRefresh ||
          !cacheRef.current.revenueStats ||
          !isCacheValid(cacheRef.current.revenueStats.timestamp)
        ) {
          const revenueResponse =
            await adminAnalyticsService.getRevenueStatistics();
          revenueStats = revenueResponse.data;
          cacheRef.current.revenueStats = {
            data: revenueStats,
            timestamp: Date.now(),
          };
        } else {
          revenueStats = cacheRef.current.revenueStats.data;
        }

        // Fetch AI grading statistics
        let aiGradingStats: AIGradingStatistics | null = null;
        if (
          forceRefresh ||
          !cacheRef.current.aiGradingStats ||
          !isCacheValid(cacheRef.current.aiGradingStats.timestamp)
        ) {
          const aiGradingResponse =
            await adminAnalyticsService.getAIGradingStatistics();
          aiGradingStats = aiGradingResponse.data;
          cacheRef.current.aiGradingStats = {
            data: aiGradingStats,
            timestamp: Date.now(),
          };
        } else {
          aiGradingStats = cacheRef.current.aiGradingStats.data;
        }

        setData({
          userStats,
          revenueStats,
          aiGradingStats,
        });
        setLastRefresh(new Date());
      } catch (error) {
        console.error("Error fetching statistics:", error);
        showErrorToast("Không thể tải thống kê. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [data.userStats, data.revenueStats, data.aiGradingStats, isCacheValid],
  );

  /**
   * Manual refresh handler
   */
  const handleManualRefresh = useCallback(() => {
    fetchStatistics(true);
  }, [fetchStatistics]);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchStatistics();
  }, []);

  /**
   * Auto-refresh every 60 seconds
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchStatistics();
    }, ANALYTICS_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchStatistics]);

  /**
   * Transform user statistics to metrics
   */
  const getUserMetrics = useCallback(
    (stats: UserStatistics): StatisticsMetric[] => {
      return [
        {
          label: "Tổng người dùng",
          value: formatNumber(stats.total_users),
          color: "blue",
        },
        {
          label: "Người dùng hoạt động",
          value: formatNumber(stats.active_users),
          color: "green",
        },
        {
          label: "Người dùng bị cấm",
          value: formatNumber(stats.banned_users),
          color: "red",
        },
        {
          label: "Người dùng miễn phí",
          value: formatNumber(stats.free_users),
          color: "gray",
        },
        {
          label: "Người dùng cơ bản",
          value: formatNumber(stats.basic_users),
          color: "blue",
        },
        {
          label: "Người dùng chuyên nghiệp",
          value: formatNumber(stats.pro_users),
          color: "green",
        },
        {
          label: "Người dùng mới tháng này",
          value: formatNumber(stats.new_users_this_month),
          color: "yellow",
        },
      ];
    },
    [],
  );

  /**
   * Transform revenue statistics to metrics
   */
  const getRevenueMetrics = useCallback(
    (stats: RevenueStatistics): StatisticsMetric[] => {
      return [
        {
          label: "Tổng doanh thu",
          value: formatCurrency(stats.total_revenue),
          color: "green",
        },
        {
          label: "Doanh thu tháng này",
          value: formatCurrency(stats.monthly_revenue),
          color: "blue",
        },
        {
          label: "Đăng ký đang hoạt động",
          value: formatNumber(stats.active_subscriptions),
          color: "green",
        },
        {
          label: "Tổng giao dịch",
          value: formatNumber(stats.total_transactions),
          color: "blue",
        },
      ];
    },
    [],
  );

  /**
   * Transform AI grading statistics to metrics
   */
  const getAIGradingMetrics = useCallback(
    (stats: AIGradingStatistics): StatisticsMetric[] => {
      return [
        {
          label: "Tổng phiên chấm điểm",
          value: formatNumber(stats.total_sessions),
          color: "blue",
        },
        {
          label: "Phiên hoàn thành",
          value: formatNumber(stats.completed_sessions),
          color: "green",
        },
        {
          label: "Phiên đang chờ",
          value: formatNumber(stats.pending_sessions),
          color: "yellow",
        },
        {
          label: "Phiên thất bại",
          value: formatNumber(stats.failed_sessions),
          color: "red",
        },
        {
          label: "Điểm trung bình",
          value: stats.average_score.toFixed(1),
          color: "blue",
        },
      ];
    },
    [],
  );

  // Show loading spinner on initial load
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" text="Đang tải thống kê..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and refresh button */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tổng quan Dashboard
          </h1>
          {lastRefresh && (
            <p
              className="text-sm text-gray-600 mt-1"
              role="status"
              aria-live="polite"
            >
              Cập nhật lần cuối: {formatDateTime(lastRefresh.toISOString())}
            </p>
          )}
        </div>

        {/* Manual refresh button */}
        <button
          onClick={handleManualRefresh}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleManualRefresh();
            }
          }}
          disabled={refreshing}
          className={`
            px-4 py-2 
            rounded-md 
            font-medium 
            text-white 
            transition-colors
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            focus:ring-[#2D6A4F]
            ${
              refreshing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#2D6A4F] hover:bg-[#1B4332]"
            }
          `}
          aria-label="Làm mới thống kê"
          tabIndex={0}
        >
          {refreshing ? "Đang làm mới..." : "Làm mới"}
        </button>
      </header>

      {/* Quick Actions Section */}
      <section
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Quick actions"
      >
        <button
          onClick={() => navigate("/admin/users")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/admin/users");
            }
          }}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D6A4F] text-left"
          tabIndex={0}
        >
          <div className="text-emerald-600 text-2xl mb-2">👥</div>
          <h3 className="font-semibold text-gray-900">Quản lý người dùng</h3>
          <p className="text-sm text-gray-500 mt-1">Xem và quản lý tài khoản</p>
        </button>

        <button
          onClick={() => navigate("/admin/lessons")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/admin/lessons");
            }
          }}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D6A4F] text-left"
          tabIndex={0}
        >
          <div className="text-blue-600 text-2xl mb-2">📚</div>
          <h3 className="font-semibold text-gray-900">Quản lý bài học</h3>
          <p className="text-sm text-gray-500 mt-1">Tạo và chỉnh sửa bài học</p>
        </button>

        <button
          onClick={() => navigate("/admin/analytics")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/admin/analytics");
            }
          }}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D6A4F] text-left"
          tabIndex={0}
        >
          <div className="text-purple-600 text-2xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-900">Thống kê chi tiết</h3>
          <p className="text-sm text-gray-500 mt-1">
            Báo cáo và phân tích dữ liệu
          </p>
        </button>

        <button
          onClick={() => navigate("/admin/activity-logs")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/admin/activity-logs");
            }
          }}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D6A4F] text-left"
          tabIndex={0}
        >
          <div className="text-orange-600 text-2xl mb-2">📝</div>
          <h3 className="font-semibold text-gray-900">Activity Logs</h3>
          <p className="text-sm text-gray-500 mt-1">Xem lịch sử hoạt động</p>
        </button>
      </section>

      {/* Statistics Cards Grid */}
      <section
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        aria-label="Dashboard statistics"
      >
        {/* User Statistics Card */}
        <StatisticsCard
          title="Thống kê người dùng"
          metrics={data.userStats ? getUserMetrics(data.userStats) : []}
          loading={refreshing && !data.userStats}
        />

        {/* Revenue Statistics Card */}
        <StatisticsCard
          title="Thống kê doanh thu"
          metrics={
            data.revenueStats ? getRevenueMetrics(data.revenueStats) : []
          }
          loading={refreshing && !data.revenueStats}
        />

        {/* AI Grading Statistics Card */}
        <StatisticsCard
          title="Thống kê chấm điểm AI"
          metrics={
            data.aiGradingStats ? getAIGradingMetrics(data.aiGradingStats) : []
          }
          loading={refreshing && !data.aiGradingStats}
        />
      </section>
    </div>
  );
}
