/**
 * StatisticsCard Component
 *
 * Displays a card with title and array of metrics with labels, values, and color coding.
 * Supports loading state with spinner.
 * Uses color coding: green for positive, red for negative, yellow for warnings, blue for info.
 *
 * Requirements: 3.7, 3.8, 13.3, 13.6
 */

import { LoadingSpinner } from "./LoadingSpinner";

export interface StatisticsMetric {
  label: string;
  value: string | number;
  color?: "green" | "red" | "yellow" | "blue" | "gray";
}

export interface StatisticsCardProps {
  title: string;
  metrics: StatisticsMetric[];
  loading?: boolean;
}

export function StatisticsCard({
  title,
  metrics,
  loading = false,
}: StatisticsCardProps) {
  // Color coding for metric values
  const colorClasses = {
    green: "text-green-700 bg-green-50",
    red: "text-red-700 bg-red-50",
    yellow: "text-yellow-700 bg-yellow-50",
    blue: "text-blue-700 bg-blue-50",
    gray: "text-gray-700 bg-gray-50",
  };

  return (
    <article className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Card Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {/* Loading State */}
      {loading ? (
        <div className="py-8">
          <LoadingSpinner size="small" text="Loading statistics..." />
        </div>
      ) : (
        /* Metrics Grid */
        <dl className="space-y-3">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
            >
              {/* Metric Label */}
              <dt className="text-sm font-medium text-gray-600">
                {metric.label}
              </dt>

              {/* Metric Value with Color Coding */}
              <dd
                className={`
                  text-base font-bold 
                  px-3 py-1 
                  rounded-md
                  ${colorClasses[metric.color || "gray"]}
                `}
              >
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
