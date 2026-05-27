/**
 * Formatting Utilities
 * Helper functions for formatting data in the admin dashboard
 */

/**
 * Format currency (VND)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Format date and time to readable string
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "vừa xong";
  } else if (diffMins < 60) {
    return `${diffMins} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return formatDate(dateString);
  }
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("vi-VN").format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Capitalize first letter
 */
export function capitalizeFirst(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitleCase(text: string): string {
  return text
    .split("_")
    .map((word) => capitalizeFirst(word))
    .join(" ");
}

/**
 * Get color class for status
 */
export function getStatusColor(
  status: string,
): "green" | "red" | "yellow" | "blue" | "gray" {
  const statusColors: Record<
    string,
    "green" | "red" | "yellow" | "blue" | "gray"
  > = {
    published: "green",
    draft: "yellow",
    active: "green",
    inactive: "gray",
    banned: "red",
    completed: "green",
    pending: "yellow",
    failed: "red",
    success: "green",
    error: "red",
    warning: "yellow",
    info: "blue",
  };

  return statusColors[status.toLowerCase()] || "gray";
}

/**
 * Get color class for action type
 */
export function getActionColor(
  action: string,
): "green" | "red" | "yellow" | "blue" | "gray" {
  const actionColors: Record<
    string,
    "green" | "red" | "yellow" | "blue" | "gray"
  > = {
    create: "blue",
    update: "yellow",
    delete: "red",
    publish: "green",
    ban: "red",
    upgrade: "green",
  };

  return actionColors[action.toLowerCase()] || "gray";
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get difficulty label in Vietnamese
 */
export function getDifficultyLabel(
  difficulty: "beginner" | "intermediate" | "advanced",
): string {
  const labels = {
    beginner: "Cơ bản",
    intermediate: "Trung bình",
    advanced: "Nâng cao",
  };
  return labels[difficulty] || difficulty;
}

/**
 * Get account type label in Vietnamese
 */
export function getAccountTypeLabel(accountType: string): string {
  const labels: Record<string, string> = {
    free: "Miễn phí",
    basic: "Cơ bản",
    pro: "Chuyên nghiệp",
  };
  return labels[accountType.toLowerCase()] || accountType;
}
