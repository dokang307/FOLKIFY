/**
 * LessonList Component
 *
 * Displays a paginated list of lessons with filtering, sorting, and actions.
 * Supports publish/unpublish and delete operations with confirmation.
 *
 * Requirements: 1.1, 1.8, 1.9, 1.10, 1.11, 9.1, 9.2, 9.6, 12.3, 12.5, 14.5, 15.1-15.5
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { adminLessonService } from "../../services/adminLessonService";
import type { Lesson } from "../../types/admin";
import { LoadingSpinner } from "./LoadingSpinner";
import { ConfirmDialog } from "./ConfirmDialog";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import {
  formatDate,
  formatDuration,
  getDifficultyLabel,
  getStatusColor,
} from "../../utils/format";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  FILTER_DEBOUNCE_DELAY,
  COLOR_CLASSES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from "../../constants/admin";
import { useDebounce } from "../../hooks/useDebounce";

interface LessonListProps {
  onEdit?: (lessonId: string) => void;
}

export function LessonList({ onEdit }: LessonListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  // Get filters from URL
  const page = parseInt(searchParams.get("page") || String(DEFAULT_PAGE));
  const instrumentId = searchParams.get("instrumentId") || undefined;
  const status =
    (searchParams.get("status") as "draft" | "published") || undefined;
  const level =
    (searchParams.get("level") as "beginner" | "intermediate" | "advanced") ||
    undefined;
  const sort =
    (searchParams.get("sort") as "title" | "created_at" | "order_index") ||
    "created_at";

  // Local filter state for immediate UI updates
  const [localStatus, setLocalStatus] = useState(status || "");
  const [localLevel, setLocalLevel] = useState(level || "");
  const [localSort, setLocalSort] = useState(sort);

  // Debounced filter values (300ms delay)
  const debouncedStatus = useDebounce(localStatus, FILTER_DEBOUNCE_DELAY);
  const debouncedLevel = useDebounce(localLevel, FILTER_DEBOUNCE_DELAY);
  const debouncedSort = useDebounce(localSort, FILTER_DEBOUNCE_DELAY);

  // Update URL when debounced values change
  useEffect(() => {
    updateFilters({
      status: debouncedStatus || undefined,
      level: debouncedLevel || undefined,
      sort: debouncedSort,
    });
  }, [debouncedStatus, debouncedLevel, debouncedSort]);

  /**
   * Extract YouTube video ID from embed URL
   * Example: https://www.youtube.com/embed/dQw4w9WgXcQ -> dQw4w9WgXcQ
   */
  const extractYouTubeVideoId = (url: string): string => {
    try {
      const match = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : "";
    } catch {
      return "";
    }
  };

  // Fetch lessons
  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminLessonService.getLessons({
        page,
        limit: DEFAULT_PAGE_SIZE,
        instrumentId,
        status,
        level,
        sort,
      });

      setLessons(response.data);

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
  }, [page, instrumentId, status, level, sort]);

  // Fetch lessons on mount and when filters change
  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Update URL query parameters
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

  // Handle publish/unpublish
  const handlePublishToggle = async (lesson: Lesson) => {
    const newStatus = lesson.status === "published" ? "draft" : "published";
    const isPublishing = newStatus === "published";

    try {
      await adminLessonService.publishLesson(lesson.id, isPublishing);

      // Update local state immediately
      setLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, status: newStatus } : l)),
      );

      showSuccessToast(
        isPublishing
          ? SUCCESS_MESSAGES.LESSON_PUBLISHED
          : SUCCESS_MESSAGES.LESSON_UNPUBLISHED,
      );
    } catch (err: any) {
      showErrorToast(err.message || ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  // Handle delete click
  const handleDeleteClick = (lesson: Lesson) => {
    setLessonToDelete(lesson);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!lessonToDelete) return;

    try {
      await adminLessonService.deleteLesson(lessonToDelete.id);

      // Remove from local state immediately
      setLessons((prev) => prev.filter((l) => l.id !== lessonToDelete.id));
      setTotal((prev) => prev - 1);

      showSuccessToast(SUCCESS_MESSAGES.LESSON_DELETED);
      setDeleteDialogOpen(false);
      setLessonToDelete(null);
    } catch (err: any) {
      showErrorToast(err.message || ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setLessonToDelete(null);
  };

  // Handle edit
  const handleEdit = (lessonId: string) => {
    if (onEdit) {
      onEdit(lessonId);
    } else {
      navigate(`/admin/lessons/${lessonId}/edit`);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    updateFilters({ page: String(newPage) });
  };

  // Render loading state
  if (loading && lessons.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner text="Đang tải danh sách bài học..." />
      </div>
    );
  }

  // Render error state
  if (error && lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchLessons}
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
          <h2 className="text-2xl font-bold text-gray-900">Quản lý bài học</h2>
          <p className="text-gray-600 mt-1" role="status" aria-live="polite">
            Tổng số: {total} bài học
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/lessons/create")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/admin/lessons/create");
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          aria-label="Tạo bài học mới"
          tabIndex={0}
        >
          Tạo bài học mới
        </button>
      </header>

      {/* Filters */}
      <section
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        aria-label="Lesson filters"
      >
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Status Filter */}
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Trạng thái
            </label>
            <select
              id="status-filter"
              value={localStatus}
              onChange={(e) => setLocalStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter lessons by status"
            >
              <option value="">Tất cả</option>
              <option value="draft">Nháp</option>
              <option value="published">Đã xuất bản</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label
              htmlFor="difficulty-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Độ khó
            </label>
            <select
              id="difficulty-filter"
              value={localLevel}
              onChange={(e) => setLocalLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter lessons by difficulty"
            >
              <option value="">Tất cả</option>
              <option value="beginner">Cơ bản</option>
              <option value="intermediate">Trung bình</option>
              <option value="advanced">Nâng cao</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label
              htmlFor="sort-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Sắp xếp theo
            </label>
            <select
              id="sort-select"
              value={localSort}
              onChange={(e) => setLocalSort(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Sort lessons by"
            >
              <option value="created_at">Ngày tạo</option>
              <option value="title">Tiêu đề</option>
              <option value="order_index">Thứ tự</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setLocalStatus("");
                setLocalLevel("");
                setLocalSort("created_at");
                setSearchParams(new URLSearchParams({ page: "1" }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setLocalStatus("");
                  setLocalLevel("");
                  setLocalSort("created_at");
                  setSearchParams(new URLSearchParams({ page: "1" }));
                }
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              aria-label="Clear all filters"
              tabIndex={0}
            >
              Xóa bộ lọc
            </button>
          </div>
        </form>
      </section>

      {/* Lessons Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhạc cụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Độ khó
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời lượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  XP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Premium
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lessons.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Không tìm thấy bài học nào
                  </td>
                </tr>
              ) : (
                lessons.map((lesson) => {
                  const statusColor = getStatusColor(lesson.status);
                  const statusColorClasses = COLOR_CLASSES[statusColor];

                  return (
                    <tr
                      key={lesson.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {/* Lazy-loaded thumbnail with placeholder */}
                          {lesson.videoUrl && (
                            <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded overflow-hidden">
                              <img
                                src={`https://img.youtube.com/vi/${extractYouTubeVideoId(lesson.videoUrl)}/default.jpg`}
                                alt={`Thumbnail for lesson: ${lesson.title}`}
                                loading="lazy"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to placeholder on error
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {lesson.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {lesson.instrumentName || lesson.instrumentId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {getDifficultyLabel(lesson.difficulty)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {formatDuration(lesson.duration)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{lesson.xp}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            lesson.isPremium
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {lesson.isPremium ? "Premium" : "Miễn phí"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColorClasses.bg} ${statusColorClasses.text}`}
                        >
                          {lesson.status === "published"
                            ? "Đã xuất bản"
                            : "Nháp"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {formatDate(lesson.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEdit(lesson.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleEdit(lesson.id);
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            aria-label={`Edit lesson: ${lesson.title}`}
                            tabIndex={0}
                          >
                            Sửa
                          </button>

                          {/* Publish/Unpublish Button */}
                          <button
                            onClick={() => handlePublishToggle(lesson)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handlePublishToggle(lesson);
                              }
                            }}
                            className={`px-3 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              lesson.status === "published"
                                ? "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500"
                                : "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                            }`}
                            aria-label={`${lesson.status === "published" ? "Unpublish" : "Publish"} lesson: ${lesson.title}`}
                            tabIndex={0}
                          >
                            {lesson.status === "published"
                              ? "Hủy xuất bản"
                              : "Xuất bản"}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteClick(lesson)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleDeleteClick(lesson);
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            aria-label={`Delete lesson: ${lesson.title}`}
                            tabIndex={0}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex justify-center items-center gap-2"
          aria-label="Lesson pagination"
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Xác nhận xóa bài học"
        message={`Bạn có chắc chắn muốn xóa bài học "${lessonToDelete?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </div>
  );
}
