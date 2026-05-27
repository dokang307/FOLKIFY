/**
 * ExpiringUsersPanel Component
 *
 * Displays premium users whose subscriptions are expiring soon.
 * Allows admin to adjust the expiration window (1-30 days).
 * Users are sorted by expiration date (soonest first).
 * User rows are clickable to navigate to user details.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { useState, useEffect } from "react";
import { adminAnalyticsService } from "../../services/adminAnalyticsService";
import { showErrorToast } from "../../utils/toast";
import { formatDate, getAccountTypeLabel } from "../../utils/format";
import { LoadingSpinner } from "./LoadingSpinner";
import type { ExpiringUser } from "../../types/admin";

interface ExpiringUsersPanelProps {
  defaultDays?: number;
}

export function ExpiringUsersPanel({
  defaultDays = 7,
}: ExpiringUsersPanelProps) {
  const [expiringUsers, setExpiringUsers] = useState<ExpiringUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(defaultDays);

  /**
   * Fetch expiring users
   */
  const fetchExpiringUsers = async (expirationDays: number) => {
    setLoading(true);
    try {
      const response = await adminAnalyticsService.getUsersExpiring({
        days: expirationDays,
      });

      // The API returns { users: ExpiringUser[], count: number, days: number }
      // We need to extract the users array
      const data = response.data as any;
      const users = data.users || [];

      // Sort by expiration date (soonest first)
      const sortedUsers = users.sort((a: ExpiringUser, b: ExpiringUser) => {
        return (
          new Date(a.premium_expires_at).getTime() -
          new Date(b.premium_expires_at).getTime()
        );
      });

      setExpiringUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching expiring users:", error);
      showErrorToast(
        "Không thể tải danh sách người dùng sắp hết hạn. Vui lòng thử lại sau.",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle days change
   */
  const handleDaysChange = (newDays: number) => {
    if (newDays >= 1 && newDays <= 30) {
      setDays(newDays);
      fetchExpiringUsers(newDays);
    }
  };

  /**
   * Handle user click - navigate to user details
   */
  const handleUserClick = (userId: string) => {
    // TODO: Implement navigation to user details page
    // For now, just log the user ID
    console.log("Navigate to user details:", userId);
  };

  /**
   * Calculate days until expiration
   */
  const calculateDaysUntilExpiration = (expiresAt: string): number => {
    const now = new Date();
    const expirationDate = new Date(expiresAt);
    const diffMs = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  /**
   * Get color for days until expiration
   */
  const getDaysColor = (days: number): string => {
    if (days <= 3) return "text-red-700 bg-red-50";
    if (days <= 7) return "text-yellow-700 bg-yellow-50";
    return "text-blue-700 bg-blue-50";
  };

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchExpiringUsers(days);
  }, []);

  return (
    <article className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Người dùng sắp hết hạn
        </h2>

        {/* Days Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="expirationDays"
            className="text-sm font-medium text-gray-700"
          >
            Trong vòng:
          </label>
          <select
            id="expirationDays"
            value={days}
            onChange={(e) => handleDaysChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            aria-label="Select expiration window in days"
          >
            <option value={1}>1 ngày</option>
            <option value={3}>3 ngày</option>
            <option value={7}>7 ngày</option>
            <option value={14}>14 ngày</option>
            <option value={30}>30 ngày</option>
          </select>
        </div>
      </header>

      {/* Loading State */}
      {loading ? (
        <div className="py-8">
          <LoadingSpinner size="medium" text="Đang tải..." />
        </div>
      ) : (
        <>
          {/* User Count */}
          <p
            className="text-sm text-gray-600 mb-4"
            role="status"
            aria-live="polite"
          >
            Tìm thấy {expiringUsers.length} người dùng
          </p>

          {/* Users List */}
          {expiringUsers.length > 0 ? (
            <ul className="space-y-2" role="list">
              {expiringUsers.map((user) => {
                const daysUntilExpiration = calculateDaysUntilExpiration(
                  user.premium_expires_at,
                );
                return (
                  <li key={user.id}>
                    <button
                      onClick={() => handleUserClick(user.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleUserClick(user.id);
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D6A4F] text-left"
                      aria-label={`View details for ${user.full_name}, expires in ${daysUntilExpiration} days`}
                      tabIndex={0}
                    >
                      {/* User Info */}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {user.full_name}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>

                      {/* Plan Type */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">
                          {getAccountTypeLabel(user.account_type)}
                        </span>

                        {/* Expiration Date */}
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {formatDate(user.premium_expires_at)}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${getDaysColor(daysUntilExpiration)}`}
                          >
                            {daysUntilExpiration === 0
                              ? "Hôm nay"
                              : daysUntilExpiration === 1
                                ? "1 ngày"
                                : `${daysUntilExpiration} ngày`}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Không có người dùng nào sắp hết hạn trong {days} ngày tới
            </div>
          )}
        </>
      )}
    </article>
  );
}
