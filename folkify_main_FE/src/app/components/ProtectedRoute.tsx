import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { isAuthenticated } from "../auth";

export function ProtectedRoute() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
