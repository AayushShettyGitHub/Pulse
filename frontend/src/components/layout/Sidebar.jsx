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
    <aside className="w-56 bg-[var(--bg-sidebar)] flex flex-col h-screen sticky top-0 shrink-0 border-r border-white/[0.05]">
      <div className="px-6 h-16 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-900/20">
          <Zap size={18} className="text-white fill-white" />
        </div>
        <span className="text-white font-bold text-base tracking-tight">Pulse</span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        <p className="px-3 mb-4 text-[11px] font-bold text-white/30 uppercase tracking-widest">System</p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13.5px] font-semibold transition-all duration-200 ${
                isActive
                  ? "!bg-white/15 !text-white shadow-md shadow-black/20"
                  : "!text-white/70 hover:!bg-white/5 hover:!text-white"
              }`}
            >
              <item.icon 
                size={18} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={isActive ? "!text-sky-400" : "!text-current"} 
              />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-[13.5px] font-semibold !text-white/70 hover:!bg-red-500/10 hover:!text-red-400 transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="flex-1 text-left">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
