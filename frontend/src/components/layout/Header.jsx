import React from "react";
import { Bell } from "lucide-react";

export default function Header() {
  const username = localStorage.getItem("username") || "User";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b border-[var(--border-color)] bg-white px-6 flex items-center justify-end gap-4 shrink-0">
      <button className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors relative">
        <Bell size={18} />
      </button>
      <div className="h-6 w-px bg-[var(--border-color)]"></div>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px] font-bold">
          {initials}
        </div>
        <span className="text-[13px] font-medium text-[var(--text-main)]">{username}</span>
      </div>
    </header>
  );
}
