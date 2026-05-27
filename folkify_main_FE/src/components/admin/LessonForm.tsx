/**
 * LessonForm Component
 *
 * Comprehensive form for creating and editing lessons with react-hook-form.
 * Supports both create and edit modes with full validation.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.6, 10.1-10.7
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { adminLessonService } from "../../services/adminLessonService";
import { instrumentService } from "../../services/instrumentService";
import type { LessonFormData, Lesson } from "../../types/admin";
import type { Instrument } from "../../services/instrumentService";
import { LoadingSpinner } from "./LoadingSpinner";
import { FileUploadModal } from "./FileUploadModal";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import { lessonFormSchema } from "../../utils/validation";
import {
  DIFFICULTY_LEVELS,
  LESSON_STATUS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from "../../constants/admin";

interface LessonFormProps {
  lessonId?: string; // undefined for create mode
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LessonForm({ lessonId, onSuccess, onCancel }: LessonFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!lessonId;

  // State
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loadingInstruments, setLoadingInstruments] = useState(true);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"video" | "sheet">("video");

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<LessonFormData>({
    mode: "onChange", // Validate on change for real-time feedback
    defaultValues: {
      title: "",
      instrumentId: "",
      difficulty: "beginner",
      duration: 1,
      description: "",
      videoUrl: "",
      xp: 0,
      isPremium: false,
      status: "draft",
    },
  });

  // Fetch instruments on mount
  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        setLoadingInstruments(true);
        const data = await instrumentService.getAll();
        setInstruments(data);
      } catch (err: any) {
        showErrorToast(err.message || "Không thể tải danh sách nhạc cụ");
      } finally {
        setLoadingInstruments(false);
      }
    };

    fetchInstruments();
  }, []);

  // Fetch lesson data in edit mode
  useEffect(() => {
    if (!isEditMode || !lessonId) return;

    const fetchLesson = async () => {
      try {
        setLoading(true);
        const response = await adminLessonService.getLessonById(lessonId);
        const lesson = response.data;

        // Store current lesson for file uploads
        setCurrentLesson(lesson);

        // Pre-fill form with lesson data
        reset({
          title: lesson.title,
          instrumentId: lesson.instrumentId,
          difficulty: lesson.difficulty,
          duration: lesson.duration,
          description: lesson.description,
          videoUrl: lesson.videoUrl || "",
          xp: lesson.xp,
          isPremium: lesson.isPremium,
          status: lesson.status,
        });
      } catch (err: any) {
        showErrorToast(err.message || ERROR_MESSAGES.NOT_FOUND);
        // Navigate back if lesson not found
        navigate("/admin/lessons");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [isEditMode, lessonId, reset, navigate]);

  // Handle form submission
  const onSubmit = async (data: LessonFormData) => {
    try {
      setSubmitting(true);

      if (isEditMode && lessonId) {
        // Edit mode: PUT request
        await adminLessonService.updateLesson(lessonId, data);
        showSuccessToast(SUCCESS_MESSAGES.LESSON_UPDATED);
      } else {
        // Create mode: POST request
        await adminLessonService.createLesson(data);
        showSuccessToast(SUCCESS_MESSAGES.LESSON_CREATED);
      }

      // Navigate to lesson list on success
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/admin/lessons");
      }
    } catch (err: any) {
      showErrorToast(err.message || ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate("/admin/lessons");
    }
  };

  // Handle video upload button click
  const handleVideoUploadClick = () => {
    if (!isEditMode || !lessonId) {
      showErrorToast("Vui lòng lưu bài học trước khi tải video lên");
      return;
    }
    setUploadType("video");
    setUploadModalOpen(true);
  };

  // Handle sheet music upload button click
  const handleSheetUploadClick = () => {
    if (!isEditMode || !lessonId) {
      showErrorToast("Vui lòng lưu bài học trước khi tải sheet nhạc lên");
      return;
    }
    setUploadType("sheet");
    setUploadModalOpen(true);
  };

  // Handle successful upload
  const handleUploadSuccess = (url: string) => {
    if (uploadType === "video") {
      setValue("videoUrl", url);
      if (currentLesson) {
        setCurrentLesson({ ...currentLesson, videoUrl: url });
      }
    } else {
      if (currentLesson) {
        setCurrentLesson({ ...currentLesson, sheetMusicUrl: url });
      }
    }
  };

  // Show loading spinner while fetching lesson data in edit mode
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner text="Đang tải dữ liệu bài học..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "Chỉnh sửa bài học" : "Tạo bài học mới"}
        </h2>
        <p className="text-gray-600 mt-1">
          {isEditMode
            ? "Cập nhật thông tin bài học"
            : "Điền thông tin để tạo bài học mới"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tiêu đề <span className="text-red-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register("title", lessonFormSchema.title)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Nhập tiêu đề bài học"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Instrument */}
          <div>
            <label
              htmlFor="instrumentId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nhạc cụ <span className="text-red-600">*</span>
            </label>
            {loadingInstruments ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-sm">Đang tải nhạc cụ...</span>
              </div>
            ) : (
              <select
                id="instrumentId"
                {...register("instrumentId", lessonFormSchema.instrumentId)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.instrumentId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Chọn nhạc cụ</option>
                {instruments.map((instrument) => (
                  <option key={instrument.id} value={instrument.id}>
                    {instrument.name}
                  </option>
                ))}
              </select>
            )}
            {errors.instrumentId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.instrumentId.message}
              </p>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Độ khó <span className="text-red-600">*</span>
            </label>
            <select
              id="difficulty"
              {...register("difficulty", lessonFormSchema.difficulty)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.difficulty ? "border-red-500" : "border-gray-300"
              }`}
            >
              {DIFFICULTY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {errors.difficulty && (
              <p className="mt-1 text-sm text-red-600">
                {errors.difficulty.message}
              </p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Thời lượng (phút) <span className="text-red-600">*</span>
            </label>
            <input
              id="duration"
              type="number"
              min="1"
              {...register("duration", {
                ...lessonFormSchema.duration,
                valueAsNumber: true,
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.duration ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Nhập thời lượng bài học"
            />
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600">
                {errors.duration.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mô tả <span className="text-red-600">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              {...register("description", lessonFormSchema.description)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Nhập mô tả chi tiết về bài học"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Video URL */}
          <div>
            <label
              htmlFor="videoUrl"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Video URL (YouTube Embed)
            </label>
            <input
              id="videoUrl"
              type="text"
              {...register("videoUrl", lessonFormSchema.videoUrl)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.videoUrl ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="https://www.youtube.com/embed/VIDEO_ID"
            />
            {errors.videoUrl && (
              <p className="mt-1 text-sm text-red-600">
                {errors.videoUrl.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Định dạng: https://www.youtube.com/embed/VIDEO_ID
            </p>
          </div>

          {/* Video Upload Section */}
          {isEditMode && lessonId && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tải video lên
              </h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleVideoUploadClick}
                  className="
                    px-4 py-2
                    text-sm font-medium
                    text-blue-700
                    bg-blue-50
                    border border-blue-300
                    rounded-md
                    hover:bg-blue-100
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    transition-colors
                  "
                >
                  Chọn file video
                </button>
                {currentLesson?.videoUrl && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <span className="inline-block w-2 h-2 bg-green-600 rounded-full" />
                    <span>Video đã được tải lên</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Loại file: mp4, webm, avi | Tối đa: 500MB
                </p>
              </div>
            </div>
          )}

          {/* Sheet Music Upload Section */}
          {isEditMode && lessonId && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tải sheet nhạc lên
              </h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSheetUploadClick}
                  className="
                    px-4 py-2
                    text-sm font-medium
                    text-blue-700
                    bg-blue-50
                    border border-blue-300
                    rounded-md
                    hover:bg-blue-100
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    transition-colors
                  "
                >
                  Chọn file sheet nhạc
                </button>
                {currentLesson?.sheetMusicUrl && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <span className="inline-block w-2 h-2 bg-green-600 rounded-full" />
                    <span>Sheet nhạc đã được tải lên</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Loại file: pdf, png, jpg | Tối đa: 10MB
                </p>
              </div>
            </div>
          )}

          {/* XP */}
          <div>
            <label
              htmlFor="xp"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Điểm kinh nghiệm (XP) <span className="text-red-600">*</span>
            </label>
            <input
              id="xp"
              type="number"
              min="0"
              {...register("xp", {
                ...lessonFormSchema.xp,
                valueAsNumber: true,
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.xp ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Nhập điểm XP"
            />
            {errors.xp && (
              <p className="mt-1 text-sm text-red-600">{errors.xp.message}</p>
            )}
          </div>

          {/* Premium Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("isPremium", lessonFormSchema.isPremium)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Bài học Premium
              </span>
            </label>
            {errors.isPremium && (
              <p className="mt-1 text-sm text-red-600">
                {errors.isPremium.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Trạng thái <span className="text-red-600">*</span>
            </label>
            <select
              id="status"
              {...register("status", lessonFormSchema.status)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.status ? "border-red-500" : "border-gray-300"
              }`}
            >
              {LESSON_STATUS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">
                {errors.status.message}
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting
              ? "Đang xử lý..."
              : isEditMode
                ? "Cập nhật"
                : "Tạo bài học"}
          </button>
        </div>
      </form>

      {/* File Upload Modal */}
      {isEditMode && lessonId && (
        <FileUploadModal
          open={uploadModalOpen}
          lessonId={lessonId}
          uploadType={uploadType}
          onSuccess={handleUploadSuccess}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
    </div>
  );
}
