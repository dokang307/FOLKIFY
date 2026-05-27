/**
 * LoadingSpinner Component
 *
 * A loading indicator for the admin dashboard that uses CSS animations
 * instead of icons. Supports customizable text and size with proper
 * accessibility attributes.
 *
 * Requirements: 9.1, 13.3, 13.5
 */

interface LoadingSpinnerProps {
  text?: string;
  size?: "small" | "medium" | "large";
}

export function LoadingSpinner({
  text = "Loading...",
  size = "medium",
}: LoadingSpinnerProps) {
  // Size mappings for spinner dimensions
  const sizeClasses = {
    small: "w-6 h-6 border-2",
    medium: "w-10 h-10 border-3",
    large: "w-16 h-16 border-4",
  };

  // Size mappings for text
  const textSizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* CSS-based spinner - no icons */}
      <div
        className={`
          ${sizeClasses[size]}
          border-gray-300
          border-t-[#2D6A4F]
          rounded-full
          animate-spin
        `}
        aria-hidden="true"
      />

      {/* Loading text */}
      <span className={`text-gray-700 ${textSizeClasses[size]}`}>{text}</span>
    </div>
  );
}
