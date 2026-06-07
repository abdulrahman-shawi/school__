"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  Wallet,
  Megaphone,
  MessageSquare,
  Settings,
  Calendar,
  FolderOpen,
  Briefcase,
  Banknote,
  ShieldAlert,
  LogOut,
  ChevronLeft,
} from "lucide-react";

const menuItems = [
  { label: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
  { label: "المستخدمون", href: "/dashboard/users", icon: Users },
  { label: "المعلمون", href: "/dashboard/teachers", icon: GraduationCap },
  { label: "الطلاب", href: "/dashboard/students", icon: Users },
  { label: "أولياء الأمور", href: "/dashboard/parents", icon: Users },
  { label: "الصفوف", href: "/dashboard/classes", icon: BookOpen },
  { label: "المواد", href: "/dashboard/subjects", icon: BookOpen },
  { label: "السنوات الدراسية", href: "/dashboard/academic-years", icon: CalendarDays },
  { label: "الجدول المدرسي", href: "/dashboard/timetable", icon: CalendarDays },
  { label: "الامتحانات", href: "/dashboard/exams", icon: ClipboardList },
  { label: "الدرجات", href: "/dashboard/marks", icon: FileText },
  { label: "الحضور", href: "/dashboard/attendance", icon: CalendarDays },
  { label: "الواجبات", href: "/dashboard/homework", icon: FileText },
  { label: "الرسوم", href: "/dashboard/fees", icon: Wallet },
  { label: "الإعلانات", href: "/dashboard/notices", icon: Megaphone },
  { label: "الرسائل", href: "/dashboard/messages", icon: MessageSquare },
  { label: "الفعاليات", href: "/dashboard/events", icon: Calendar },
  { label: "المستندات", href: "/dashboard/documents", icon: FolderOpen },
  { label: "الإجازات", href: "/dashboard/leaves", icon: Briefcase },
  { label: "الرواتب", href: "/dashboard/payroll", icon: Banknote },
  { label: "السلوك", href: "/dashboard/behavior", icon: ShieldAlert },
  { label: "الإعدادات", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 overflow-y-auto border-l border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-700">نظام المدرسة</h1>
      </div>
      <nav className="space-y-1 p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronLeft className="h-4 w-4" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
