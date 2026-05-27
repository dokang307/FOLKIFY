/**
 * AdminNavigation Component
 * Navigation menu for admin sections with keyboard support
 *
 * Requirements: 8.1, 8.2, 8.3, 13.1, 13.2, 13.3
 */

import { Link, useLocation } from "react-router";

interface NavigationItem {
  path: string;
  label: string;
  exact: boolean;
}

interface AdminNavigationProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

const navItems: NavigationItem[] = [
  { path: "/admin", label: "Dashboard", exact: true },
  { path: "/admin/lessons", label: "Lessons", exact: false },
  { path: "/admin/analytics", label: "Analytics", exact: false },
  { path: "/admin/activity-logs", label: "Activity Logs", exact: false },
];

export function AdminNavigation({
  isMobile = false,
  onNavigate,
}: AdminNavigationProps) {
  const location = useLocation();

  const isActive = (path: string, exact: boolean): boolean => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLAnchorElement>,
    path: string,
  ) => {
    // Support keyboard navigation with Enter and Space keys - Requirement 13.1
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = path;
    }
  };

  // Mobile Navigation - Requirement 8.1, 8.2
  if (isMobile) {
    return (
      <nav
        className="px-4 py-4 space-y-2"
        aria-label="Mobile navigation"
        role="navigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            onKeyDown={(e) => handleKeyDown(e, item.path)}
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50 ${
              isActive(item.path, item.exact)
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            aria-current={isActive(item.path, item.exact) ? "page" : undefined}
            tabIndex={0}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  // Desktop Navigation - Requirement 8.1, 8.2, 8.3
  return (
    <nav
      className="hidden lg:flex items-center space-x-8"
      aria-label="Main navigation"
      role="navigation"
    >
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onKeyDown={(e) => handleKeyDown(e, item.path)}
          className={`text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1 ${
            isActive(item.path, item.exact)
              ? "text-blue-600 border-b-2 border-blue-600 pb-1"
              : "text-gray-600 hover:text-gray-900"
          }`}
          aria-current={isActive(item.path, item.exact) ? "page" : undefined}
          tabIndex={0}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
