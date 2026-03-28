import { Home, BookOpen, Music2, FileText, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

const navItems = [
  { path: "/", icon: Home, label: "Trang chủ" },
  { path: "/learn", icon: BookOpen, label: "Học" },
  { path: "/practice", icon: Music2, label: "Luyện tập" },
  { path: "/sheets", icon: FileText, label: "Sheet" },
  { path: "/profile", icon: User, label: "Hồ sơ" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-100 px-2 pt-2 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.07)]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                active ? "text-[#1A3A2B]" : "text-gray-400"
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-all duration-200 ${active ? "bg-[#E8F5EE]" : ""}`}>
                <item.icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? "text-[#1A3A2B]" : "text-gray-400"}
                />
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2D6A4F]" />
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${active ? "text-[#1A3A2B]" : "text-gray-400"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
