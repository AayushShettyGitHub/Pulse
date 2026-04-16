import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Activity, 
  CalendarCheck2, 
  LogOut,
  Zap
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Activity, label: "Uptime", path: "/uptime" },
    { icon: CalendarCheck2, label: "Attendance", path: "/attendance-stats" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <aside className="w-56 bg-[var(--bg-sidebar)] flex flex-col h-screen sticky top-0 shrink-0">
      <div className="px-5 h-14 flex items-center gap-2.5 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-md bg-sky-600 flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-white font-semibold text-sm tracking-tight">Pulse</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold text-[var(--text-sidebar)] uppercase tracking-wider">Menu</p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-[var(--text-sidebar)] hover:bg-white/[0.04] hover:text-white/80"
              }`}
            >
              <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
