/**
 * Protected Admin Route Component
 * Ensures only authenticated admin users can access admin routes
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { isAuthenticated, getCurrentUser } from "../../app/auth";

export function ProtectedAdminRoute() {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: "auto" });

    // Check authentication and admin role
    const checkAdminAccess = () => {
      if (!isAuthenticated()) {
        setIsChecking(false);
        return;
      }

      const user = getCurrentUser();
      if (user && user.role === "admin") {
        setIsAdmin(true);
      }
      setIsChecking(false);
    };

    checkAdminAccess();
  }, [location.pathname]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // Requirement 11.1: Redirect non-authenticated users to login page
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Requirement 11.2: Redirect non-admin users to home page with error message
  if (!isAdmin) {
    // Store error message in sessionStorage to display on home page
    sessionStorage.setItem(
      "access_error",
      "Access denied. Admin privileges required.",
    );
    return <Navigate to="/" replace />;
  }

  // Requirement 11.3: JWT token is included in Authorization header by api.ts
  // The api client in src/config/api.ts automatically includes the JWT token
  // in the Authorization header for all API requests

  // User is authenticated and has admin role, render the admin routes
  return <Outlet />;
}
