/**
 * Hook for handling API errors with retry functionality
 *
 * Requirements: 9.3, 9.4
 */

import { useState, useCallback } from "react";
import { showErrorToast } from "../utils/toast";

interface UseApiErrorOptions {
  onRetry?: () => void | Promise<void>;
  showToast?: boolean;
}

interface UseApiErrorReturn {
  error: string | null;
  isNetworkError: boolean;
  handleError: (error: Error) => void;
  retry: () => Promise<void>;
  clearError: () => void;
}

export function useApiError(
  options: UseApiErrorOptions = {},
): UseApiErrorReturn {
  const { onRetry, showToast = true } = options;
  const [error, setError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const handleError = useCallback(
    (error: Error) => {
      const errorMessage = error.message;
      setError(errorMessage);

      // Check if it's a network error
      const isNetwork = errorMessage.includes("Network error");
      setIsNetworkError(isNetwork);

      // Show toast notification if enabled
      if (showToast) {
        showErrorToast(errorMessage);
      }
    },
    [showToast],
  );

  const retry = useCallback(async () => {
    if (onRetry) {
      setError(null);
      setIsNetworkError(false);
      try {
        await onRetry();
      } catch (err) {
        if (err instanceof Error) {
          handleError(err);
        }
      }
    }
  }, [onRetry, handleError]);

  const clearError = useCallback(() => {
    setError(null);
    setIsNetworkError(false);
  }, []);

  return {
    error,
    isNetworkError,
    handleError,
    retry,
    clearError,
  };
}
