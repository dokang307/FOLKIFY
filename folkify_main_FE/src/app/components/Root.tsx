import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import { BottomNav } from "./BottomNav";

export function Root() {
  const { pathname } = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="flex justify-center min-h-screen bg-[#F7FAF8]">
      <div className="relative w-full max-w-sm min-h-screen shadow-2xl overflow-hidden flex flex-col">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
