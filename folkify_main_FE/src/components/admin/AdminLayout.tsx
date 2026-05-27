/**
 * AdminLayout Component
 * Provides consistent layout structure for all admin pages
 *
 * Requirements: 7.1, 7.2, 7.3, 8.1, 8.4, 8.5, 8.6, 13.1, 13.2, 13.3, 13.6
 */

import { useState } from "react";
import { Outlet } from "react-router";
import { getCurrentUser, logout } from "../../app/auth";
import { AdminNavigation } from "./AdminNavigation";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Requirement 8.4, 8.5 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Folkify Admin</h1>
            </div>

            {/* Desktop Navigation - Requirement 8.1 */}
            <AdminNavigation />

            {/* User Info and Logout - Requirement 8.4, 8.5 */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || "admin"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleLogout();
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                aria-label="Logout from admin dashboard"
                tabIndex={0}
              >
                Logout
              </button>

              {/* Mobile Menu Button - Requirement 7.3 */}
              <button
                onClick={toggleMobileMenu}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleMobileMenu();
                  }
                  if (e.key === "Escape" && isMobileMenuOpen) {
                    closeMobileMenu();
                  }
                }}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
                tabIndex={0}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Requirement 7.2, 7.3 */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <AdminNavigation isMobile onNavigate={closeMobileMenu} />
            {/* Mobile User Info */}
            <div className="md:hidden px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || "admin"}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area - Requirement 8.6, 13.3 */}
      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        role="main"
        aria-label="Admin dashboard main content"
      >
        {/* Render nested routes via Outlet, or children for backward compatibility */}
        {children || <Outlet />}
      </main>
    </div>
  );
}
