/**
 * ActivityLogList Component
 *
 * Displays paginated activity logs with filtering and expandable details.
 * Features auto-refresh every 30 seconds, color-coded action types, and keyboard navigation.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 9.1, 9.2, 13.1, 14.2, 14.3, 15.1-15.5
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { adminActivityLogService } from "../../services/adminActivityLogService";
import type { ActivityLog } from "../../types/admin";
import { LoadingSpinner } from "./LoadingSpinner";
import { showErrorToast } from "../../utils/toast";
import {
  formatDateTime,
  formatRelativeTime,
  getActionColor,
} from "../../utils/format";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  ACTIVITY_LOGS_REFRESH_INTERVAL,
  FILTER_DEBOUNCE_DELAY,
  COLOR_CLASSES,
  ERROR_MESSAGES,
  ACTION_TYPES,
  RESOURCE_TYPES,
} from "../../constants/admin";
import { useDebounce } from "../../hooks/useDebounce";

export function ActivityLogList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Get filters from URL
  const page = parseInt(searchParams.get("page") || String(DEFAULT_PAGE));
  const action = searchParams.get("action") || undefined;
  const resourceType = searchParams.get("resource_type") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  // Local filter state for immediate UI updates
  const [localAction, setLocalAction] = useState(action || "");
  const [localResourceType, setLocalResourceType] = useState(
    resourceType || "",
  );
  const [localStartDate, setLocalStartDate] = useState(startDate || "");
  const [localEndDate, setLocalEndDate] = useState(endDate || "");

  // Debounced filter values (300ms delay)
  const debouncedAction = useDebounce(localAction, FILTER_DEBOUNCE_DELAY);
  const debouncedResourceType = useDebounce(
    localResourceType,
    FILTER_DEBOUNCE_DELAY,
  );
  const debouncedStartDate = useDebounce(localStartDate, FILTER_DEBOUNCE_DELAY);
  const debouncedEndDate = useDebounce(localEndDate, FILTER_DEBOUNCE_DELAY);

  // Update URL when debounced values change
  useEffect(() => {
    updateFilters({
      action: debouncedAction || undefined,
      resource_type: debouncedResourceType || undefined,
      startDate: debouncedStartDate || undefined,
      endDate: debouncedEndDate || undefined,
    });
  }, [
    debouncedAction,
    debouncedResourceType,
    debouncedStartDate,
    debouncedEndDate,
  ]);

  /**
   * Fetch activity logs
   */
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminActivityLogService.getActivityLogs({
        page,
        limit: DEFAULT_PAGE_SIZE,
        action,
        resource_type: resourceType,
        startDate,
        endDate,
      });

      setLogs(response.data);

      if (response.pagination) {
        setTotal(response.pagination.total);
        setTotalPages(
          response.pagination.totalPages ||
            Math.ceil(response.pagination.total / DEFAULT_PAGE_SIZE),
        );
      }
    } catch (err: any) {
      const errorMessage = err.message || ERROR_MESSAGES.SERVER_ERROR;
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, action, resourceType, startDate, endDate]);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /**
   * Auto-refresh every 30 seconds
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchLogs();
    }, ACTIVITY_LOGS_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchLogs]);

  /**
   * Update URL query parameters
   */
  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });

      // Reset to page 1 when filters change
      if (!updates.page) {
        newParams.set("page", "1");
      }

      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  /**
   * Handle pagination
   */
  const handlePageChange = (newPage: number) => {
    updateFilters({ page: String(newPage) });
  };

  /**
   * Toggle log expansion
   */
  const toggleLogExpansion = (logId: string) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  /**
   * Handle keyboard navigation for log expansion
   */
  const handleLogKeyDown = (event: React.KeyboardEvent, logId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleLogExpansion(logId);
    }
  };

  /**
   * Get action label in Vietnamese
   */
  const getActionLabel = (action: string): string => {
    const actionType = ACTION_TYPES.find((a) => a.value === action);
    return actionType?.label || action;
  };

  /**
   * Get resource type label in Vietnamese
   */
  const getResourceTypeLabel = (resourceType: string): string => {
    const resource = RESOURCE_TYPES.find((r) => r.value === resourceType);
    return resource?.label || resourceType;
  };

  // Render loading state
  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner text="Đang tải nhật ký hoạt động..." />
      </div>
    );
  }

  // Render error state
  if (error && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Nhật ký hoạt động
          </h2>
          <p className="text-gray-600 mt-1" role="status" aria-live="polite">
            Tổng số: {total} hoạt động | Tự động làm mới mỗi 30 giây
          </p>
        </div>
        <button
          onClick={fetchLogs}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fetchLogs();
            }
          }}
          disabled={loading}
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
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#2D6A4F] hover:bg-[#1B4332]"
            }
          `}
          aria-label="Làm mới nhật ký"
          tabIndex={0}
        >
          {loading ? "Đang làm mới..." : "Làm mới"}
        </button>
      </header>

      {/* Filters */}
      <section
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        aria-label="Activity log filters"
      >
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Action Filter */}
          <div>
            <label
              htmlFor="action-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Loại hành động
            </label>
            <select
              id="action-filter"
              value={localAction}
              onChange={(e) => setLocalAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by action type"
            >
              <option value="">Tất cả</option>
              {ACTION_TYPES.map((actionType) => (
                <option key={actionType.value} value={actionType.value}>
                  {actionType.label}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Type Filter */}
          <div>
            <label
              htmlFor="resource-type-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Loại tài nguyên
            </label>
            <select
              id="resource-type-filter"
              value={localResourceType}
              onChange={(e) => setLocalResourceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by resource type"
            >
              <option value="">Tất cả</option>
              {RESOURCE_TYPES.map((resource) => (
                <option key={resource.value} value={resource.value}>
                  {resource.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label
              htmlFor="start-date-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Từ ngày
            </label>
            <input
              type="date"
              id="start-date-filter"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter from date"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label
              htmlFor="end-date-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Đến ngày
            </label>
            <input
              type="date"
              id="end-date-filter"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter to date"
            />
          </div>
        </form>

        {/* Clear Filters Button */}
        <div className="mt-4">
          <button
            onClick={() => {
              setLocalAction("");
              setLocalResourceType("");
              setLocalStartDate("");
              setLocalEndDate("");
              setSearchParams(new URLSearchParams({ page: "1" }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setLocalAction("");
                setLocalResourceType("");
                setLocalStartDate("");
                setLocalEndDate("");
                setSearchParams(new URLSearchParams({ page: "1" }));
              }
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            aria-label="Clear all filters"
            tabIndex={0}
          >
            Xóa bộ lọc
          </button>
        </div>
      </section>

      {/* Activity Logs List */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500 text-lg">
              Không tìm thấy nhật ký hoạt động nào
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const actionColor = getActionColor(log.action);
            const actionColorClasses = COLOR_CLASSES[actionColor];
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Log Entry Header - Clickable */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleLogExpansion(log.id)}
                  onKeyDown={(e) => handleLogKeyDown(e, log.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`Nhật ký hoạt động: ${getActionLabel(log.action)} ${getResourceTypeLabel(log.resource_type)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Main info */}
                    <div className="flex-1 space-y-2">
                      {/* Action and Resource Type */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${actionColorClasses.bg} ${actionColorClasses.text}`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {getResourceTypeLabel(log.resource_type)}
                        </span>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-600 text-sm font-mono">
                          ID: {log.resource_id}
                        </span>
                      </div>

                      {/* Admin and Timestamp */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">
                          {log.adminName || `Admin ${log.admin_id}`}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span title={formatDateTime(log.created_at)}>
                          {formatRelativeTime(log.created_at)}
                        </span>
                        {log.ip_address && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="font-mono">{log.ip_address}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side - Expand indicator */}
                    <div className="flex-shrink-0">
                      <span
                        className={`text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      >
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Chi tiết thay đổi:
                    </h4>
                    <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-xs font-mono text-gray-800">
                      {JSON.stringify(log.changes, null, 2)}
                    </pre>

                    {/* Additional metadata */}
                    {log.user_agent && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">User Agent:</span>{" "}
                          {log.user_agent}
                        </p>
                      </div>
                    )}

                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Thời gian chính xác: {formatDateTime(log.created_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex justify-center items-center gap-2"
          aria-label="Activity log pagination"
        >
          <button
            onClick={() => handlePageChange(page - 1)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (page > 1) handlePageChange(page - 1);
              }
            }}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Go to previous page"
            tabIndex={0}
          >
            Trang trước
          </button>

          <div className="flex gap-1" role="list">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1);

                if (!showPage) {
                  // Show ellipsis
                  if (pageNum === page - 2 || pageNum === page + 2) {
                    return (
                      <span
                        key={pageNum}
                        className="px-3 py-2 text-gray-500"
                        aria-hidden="true"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }
                    }}
                    className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      pageNum === page
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={pageNum === page ? "page" : undefined}
                    tabIndex={0}
                  >
                    {pageNum}
                  </button>
                );
              },
            )}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (page < totalPages) handlePageChange(page + 1);
              }
            }}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Go to next page"
            tabIndex={0}
          >
            Trang sau
          </button>
        </nav>
      )}
    </div>
  );
}
