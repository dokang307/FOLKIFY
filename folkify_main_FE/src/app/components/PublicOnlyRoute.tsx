import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { isAuthenticated } from "../auth";

export function PublicOnlyRoute() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
