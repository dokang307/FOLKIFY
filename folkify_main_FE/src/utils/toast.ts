/**
 * Toast Notification Utilities
 *
 * Utility functions for displaying success and error toast notifications.
 * Uses sonner library with text-only messages (no icons).
 * Toasts display for 3 seconds by default.
 *
 * Requirements: 9.6, 9.7, 9.8
 */

import { toast as sonnerToast } from "sonner";

/**
 * Display a success toast notification
 * @param message - The success message to display
 */
export function showSuccessToast(message: string): void {
  sonnerToast.success(message);
}

/**
 * Display an error toast notification
 * @param message - The error message to display
 */
export function showErrorToast(message: string): void {
  sonnerToast.error(message);
}

/**
 * Display an info toast notification
 * @param message - The info message to display
 */
export function showInfoToast(message: string): void {
  sonnerToast.info(message);
}

/**
 * Display a warning toast notification
 * @param message - The warning message to display
 */
export function showWarningToast(message: string): void {
  sonnerToast.warning(message);
}

/**
 * Display a loading toast notification
 * @param message - The loading message to display
 * @returns Toast ID that can be used to dismiss or update the toast
 */
export function showLoadingToast(message: string): string | number {
  return sonnerToast.loading(message);
}

/**
 * Dismiss a specific toast by ID
 * @param toastId - The ID of the toast to dismiss
 */
export function dismissToast(toastId: string | number): void {
  sonnerToast.dismiss(toastId);
}

/**
 * Dismiss all active toasts
 */
export function dismissAllToasts(): void {
  sonnerToast.dismiss();
}
