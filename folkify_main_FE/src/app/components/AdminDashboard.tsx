import { useEffect, useState } from "react";
import {
  adminService,
  UserStatistics,
  RevenueStatistics,
  AIGradingStatistics,
} from "../../services/adminService";
import { useNavigate } from "react-router";
import { getCurrentUser } from "../auth";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStatistics | null>(
    null,
  );
  const [aiStats, setAIStats] = useState<AIGradingStatistics | null>(null);

  useEffect(() => {
    // Check if user is admin
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    loadStatistics();
  }, [navigate]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const [users, revenue, ai] = await Promise.all([
        adminService.getUserStatistics(),
        adminService.getRevenueStatistics(),
        adminService.getAIGradingStatistics(),
      ]);
      setUserStats(users);
      setRevenueStats(revenue);
      setAIStats(ai);
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Quản lý và thống kê hệ thống
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/users")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-emerald-600 text-2xl mb-2">👥</div>
            <h3 className="font-semibold text-gray-900">Quản lý người dùng</h3>
            <p className="text-sm text-gray-500 mt-1">
              Xem và quản lý tài khoản
            </p>
          </button>

          <button
            onClick={() => alert("Tính năng đang phát triển")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow opacity-50 cursor-not-allowed"
          >
            <div className="text-blue-600 text-2xl mb-2">📚</div>
            <h3 className="font-semibold text-gray-900">Quản lý bài học</h3>
            <p className="text-sm text-gray-500 mt-1">Đang phát triển...</p>
          </button>

          <button
            onClick={() => alert("Tính năng đang phát triển")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow opacity-50 cursor-not-allowed"
          >
            <div className="text-purple-600 text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900">Thống kê chi tiết</h3>
            <p className="text-sm text-gray-500 mt-1">Đang phát triển...</p>
          </button>

          <button
            onClick={() => alert("Tính năng đang phát triển")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow opacity-50 cursor-not-allowed"
          >
            <div className="text-orange-600 text-2xl mb-2">📝</div>
            <h3 className="font-semibold text-gray-900">Activity Logs</h3>
            <p className="text-sm text-gray-500 mt-1">Đang phát triển...</p>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* User Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thống kê người dùng
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng số người dùng:</span>
                <span className="font-semibold">
                  {userStats?.total_users || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đang hoạt động:</span>
                <span className="font-semibold text-green-600">
                  {userStats?.active_users || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bị khóa:</span>
                <span className="font-semibold text-red-600">
                  {userStats?.banned_users || 0}
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Free:</span>
                  <span>{userStats?.free_users || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Basic:</span>
                  <span>{userStats?.basic_users || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pro:</span>
                  <span>{userStats?.pro_users || 0}</span>
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mới tháng này:</span>
                  <span className="font-semibold text-emerald-600">
                    {userStats?.new_users_this_month || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thống kê doanh thu
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng doanh thu:</span>
                <span className="font-semibold text-green-600">
                  {(revenueStats?.total_revenue || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Doanh thu tháng:</span>
                <span className="font-semibold">
                  {(revenueStats?.monthly_revenue || 0).toLocaleString("vi-VN")}{" "}
                  đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gói đang hoạt động:</span>
                <span className="font-semibold">
                  {revenueStats?.active_subscriptions || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng giao dịch:</span>
                <span className="font-semibold">
                  {revenueStats?.total_transactions || 0}
                </span>
              </div>
            </div>
          </div>

          {/* AI Grading Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thống kê AI Grading
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng số phiên:</span>
                <span className="font-semibold">
                  {aiStats?.total_sessions || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hoàn thành:</span>
                <span className="font-semibold text-green-600">
                  {aiStats?.completed_sessions || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đang xử lý:</span>
                <span className="font-semibold text-yellow-600">
                  {aiStats?.pending_sessions || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thất bại:</span>
                <span className="font-semibold text-red-600">
                  {aiStats?.failed_sessions || 0}
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm trung bình:</span>
                  <span className="font-semibold text-emerald-600">
                    {aiStats?.average_score?.toFixed(1) || 0}/100
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
