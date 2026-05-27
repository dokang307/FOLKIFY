/**
 * FileUploadModal Component
 *
 * Modal for uploading video and sheet music files for lessons.
 * Supports file type validation, file size validation, progress tracking,
 * and image preview for sheet music files.
 *
 * Requirements: 2.1, 2.2, 2.5, 2.6, 2.4
 */

import { useState, useRef, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { adminLessonService } from "../../services/adminLessonService";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import {
  VIDEO_MAX_SIZE_MB,
  SHEET_MUSIC_MAX_SIZE_MB,
  VIDEO_ALLOWED_TYPES,
  SHEET_MUSIC_ALLOWED_TYPES,
  SUCCESS_MESSAGES,
} from "../../constants/admin";

export interface FileUploadModalProps {
  open: boolean;
  lessonId: string;
  uploadType: "video" | "sheet";
  onSuccess: (url: string) => void;
  onClose: () => void;
}

export function FileUploadModal({
  open,
  lessonId,
  uploadType,
  onSuccess,
  onClose,
}: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration based on upload type
  const config =
    uploadType === "video"
      ? {
          title: "Tải video lên",
          accept: VIDEO_ALLOWED_TYPES.map((ext) => `.${ext}`).join(","),
          maxSizeMB: VIDEO_MAX_SIZE_MB,
          allowedTypes: VIDEO_ALLOWED_TYPES,
          successMessage: SUCCESS_MESSAGES.VIDEO_UPLOADED,
        }
      : {
          title: "Tải sheet nhạc lên",
          accept: SHEET_MUSIC_ALLOWED_TYPES.map((ext) => `.${ext}`).join(","),
          maxSizeMB: SHEET_MUSIC_MAX_SIZE_MB,
          allowedTypes: SHEET_MUSIC_ALLOWED_TYPES,
          successMessage: SUCCESS_MESSAGES.SHEET_UPLOADED,
        };

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setUploading(false);
      setUploadProgress(0);
      setValidationError(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [open]);

  /**
   * Validate file type and size
   */
  const validateFile = (file: File): string | null => {
    // Extract file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    // Validate file type
    if (!fileExtension || !config.allowedTypes.includes(fileExtension)) {
      return `Loại file không hợp lệ. Chỉ chấp nhận: ${config.allowedTypes.join(", ")}`;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > config.maxSizeMB) {
      return `Kích thước file vượt quá giới hạn ${config.maxSizeMB}MB`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Clear validation error
    setValidationError(null);
    setSelectedFile(file);

    // Generate preview for image files (sheet music)
    if (
      uploadType === "sheet" &&
      (file.type.startsWith("image/") || file.type === "application/pdf")
    ) {
      // For images, create object URL
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        // For PDFs, we can't easily preview, so just show file info
        setPreviewUrl(null);
      }
    }
  };

  /**
   * Handle file upload
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      let response;
      if (uploadType === "video") {
        response = await adminLessonService.uploadVideo(
          lessonId,
          selectedFile,
          (progress) => {
            setUploadProgress(Math.round(progress));
          },
        );
        onSuccess(response.data.videoUrl);
      } else {
        response = await adminLessonService.uploadSheetMusic(
          lessonId,
          selectedFile,
          (progress) => {
            setUploadProgress(Math.round(progress));
          },
        );
        onSuccess(response.data.sheetMusicUrl);
      }

      showSuccessToast(config.successMessage);
      onClose();
    } catch (err: any) {
      showErrorToast(err.message || "Tải file lên thất bại");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Handle browse button click
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !uploading) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="
            fixed left-1/2 top-1/2 z-50 
            -translate-x-1/2 -translate-y-1/2
            w-full max-w-md
            bg-white rounded-lg shadow-lg
            p-6
            data-[state=open]:animate-in 
            data-[state=closed]:animate-out 
            data-[state=closed]:fade-out-0 
            data-[state=open]:fade-in-0 
            data-[state=closed]:zoom-out-95 
            data-[state=open]:zoom-in-95
            focus:outline-none
          "
          onEscapeKeyDown={(e) => {
            if (!uploading) {
              e.preventDefault();
              onClose();
            }
          }}
          aria-describedby="upload-modal-description"
        >
          {/* Title */}
          <Dialog.Title
            className="text-xl font-semibold mb-4 text-gray-900"
            id="upload-modal-title"
          >
            {config.title}
          </Dialog.Title>

          {/* File Input (Hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept={config.accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
            aria-label={`Select ${uploadType} file to upload`}
          />

          {/* File Selection Area */}
          <div className="space-y-4" id="upload-modal-description">
            {/* Browse Button */}
            <div>
              <button
                type="button"
                onClick={handleBrowseClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleBrowseClick();
                  }
                }}
                disabled={uploading}
                className="
                  w-full px-4 py-3
                  text-sm font-medium
                  text-blue-700
                  bg-blue-50
                  border-2 border-blue-300 border-dashed
                  rounded-lg
                  hover:bg-blue-100
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  transition-colors
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
                aria-label={`Browse for ${uploadType} file`}
                tabIndex={0}
              >
                Chọn file
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Loại file: {config.allowedTypes.join(", ")} | Tối đa:{" "}
                {config.maxSizeMB}MB
              </p>
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{validationError}</p>
              </div>
            )}

            {/* Selected File Info */}
            {selectedFile && !validationError && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}

            {/* Image Preview (for sheet music images) */}
            {previewUrl && uploadType === "sheet" && (
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <img
                  src={previewUrl}
                  alt={`Preview of selected ${uploadType} file`}
                  className="w-full h-auto max-h-64 object-contain bg-gray-50"
                />
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2" role="status" aria-live="polite">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Đang tải lên...</span>
                  <span
                    aria-label={`Upload progress: ${uploadProgress} percent`}
                  >
                    {uploadProgress}%
                  </span>
                </div>
                <div
                  className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!uploading) onClose();
                }
              }}
              disabled={uploading}
              className="
                px-4 py-2
                text-sm font-medium
                text-gray-700
                bg-white
                border border-gray-300
                rounded-md
                hover:bg-gray-50
                focus:outline-none
                focus:ring-2
                focus:ring-offset-2
                focus:ring-gray-500
                transition-colors
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
              aria-label="Cancel upload"
              tabIndex={0}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleUpload}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (selectedFile && !validationError && !uploading) {
                    handleUpload();
                  }
                }
              }}
              disabled={!selectedFile || !!validationError || uploading}
              className="
                px-4 py-2
                text-sm font-medium
                text-white
                bg-blue-600
                rounded-md
                hover:bg-blue-700
                focus:outline-none
                focus:ring-2
                focus:ring-offset-2
                focus:ring-blue-500
                transition-colors
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
              aria-label={uploading ? "Uploading file" : "Upload selected file"}
              tabIndex={0}
            >
              {uploading ? "Đang tải..." : "Tải lên"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
