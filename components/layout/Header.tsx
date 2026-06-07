"use client";

import { getInitials } from "@/lib/utils";
import { Bell, Search, User } from "lucide-react";
import { logout } from "@/lib/auth";

interface HeaderProps {
  user?: { name: string; role: string } | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث..."
            className="h-9 w-64 rounded-lg border border-gray-300 bg-gray-50 pr-9 pl-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3 border-r border-gray-200 pr-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name || "مستخدم"}</p>
            <p className="text-xs text-gray-500">{user?.role || "-"}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
              title="تسجيل الخروج"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
