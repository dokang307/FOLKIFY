/**
 * Error Display Component
 * Displays error messages with optional retry button
 *
 * Requirements: 9.3, 9.4
 */

import React from "react";

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  className = "",
}: ErrorDisplayProps) {
  const isNetworkError = error.includes("Network error");

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="text-red-800 font-semibold mb-1">Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>

      {/* Show retry button for network errors - Requirement: 9.3 */}
      {isNetworkError && onRetry && (
        <div className="mt-3">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
