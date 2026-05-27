/**
 * Error Handling Example Component
 * Demonstrates all error handling patterns for the admin dashboard
 *
 * This component shows how to:
 * - Handle 401 Unauthorized errors (automatic redirect)
 * - Handle 403 Forbidden errors (display message)
 * - Handle network errors (display message with retry button)
 * - Use the ErrorDisplay component
 * - Use the useApiError hook
 *
 * Requirements: 9.2, 9.3, 9.4, 9.5
 */

import React, { useState } from "react";
import { api } from "../../config/api";
import { useApiError } from "../../hooks/useApiError";
import { ErrorDisplay } from "../ErrorDisplay";
import { LoadingSpinner } from "./LoadingSpinner";

export function ErrorHandlingExample() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/admin/analytics/users");
      setData(response);
      clearError();
    } catch (err) {
      if (err instanceof Error) {
        handleError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const { error, isNetworkError, handleError, retry, clearError } = useApiError(
    {
      onRetry: fetchData,
      showToast: true,
    },
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Error Handling Examples</h2>

      <div className="space-y-6">
        {/* Example 1: Normal API call with error handling */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Example 1: Fetch Analytics Data
          </h3>
          <p className="text-gray-600 mb-4">
            This demonstrates error handling for a typical API call. Try it to
            see how different errors are handled.
          </p>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading..." : "Fetch Data"}
          </button>

          {loading && (
            <div className="mt-4">
              <LoadingSpinner text="Loading data..." />
            </div>
          )}

          {error && (
            <div className="mt-4">
              <ErrorDisplay
                error={error}
                onRetry={isNetworkError ? retry : undefined}
              />
            </div>
          )}

          {data && !error && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-800 font-semibold">Success!</p>
              <pre className="text-sm text-green-700 mt-2 overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Example 2: Error types explanation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Example 2: Error Types</h3>
          <div className="space-y-3 text-sm">
            <div className="border-l-4 border-red-500 pl-4">
              <p className="font-semibold text-gray-800">
                401 Unauthorized Error
              </p>
              <p className="text-gray-600">
                When JWT token expires or is invalid, the app automatically:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-1">
                <li>Clears all authentication data from localStorage</li>
                <li>Redirects to the login page</li>
                <li>User must log in again</li>
              </ul>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="font-semibold text-gray-800">403 Forbidden Error</p>
              <p className="text-gray-600">
                When user lacks permission, the app:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-1">
                <li>
                  Displays: "You do not have permission to perform this action."
                </li>
                <li>Does NOT redirect (user stays on current page)</li>
                <li>Shows error in toast notification</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold text-gray-800">Network Error</p>
              <p className="text-gray-600">
                When network connection fails, the app:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-1">
                <li>
                  Displays: "Network error. Please check your connection."
                </li>
                <li>Shows a Retry button</li>
                <li>User can retry the request</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Example 3: Usage pattern */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Example 3: Usage Pattern
          </h3>
          <p className="text-gray-600 mb-3">
            Here's how to use error handling in your components:
          </p>
          <pre className="bg-gray-100 rounded p-4 text-xs overflow-auto">
            {`import { useApiError } from "../../hooks/useApiError";
import { ErrorDisplay } from "../ErrorDisplay";
import { api } from "../../config/api";

function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/endpoint");
      // Handle success
      clearError();
    } catch (err) {
      if (err instanceof Error) {
        handleError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const { error, isNetworkError, handleError, retry, clearError } =
    useApiError({
      onRetry: fetchData,
      showToast: true,
    });

  return (
    <div>
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={isNetworkError ? retry : undefined} 
        />
      )}
      {/* Your component content */}
    </div>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
