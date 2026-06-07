import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  BookOpen,
  Wallet,
  CalendarDays,
  FileText,
} from "lucide-react";

async function getStats() {
  const [
    studentsCount,
    teachersCount,
    classesCount,
    unpaidFees,
    todayAttendance,
    pendingHomework,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.feeCollection.aggregate({
      where: { status: { in: ["UNPAID", "PARTIAL"] } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: "PRESENT",
      },
    }),
    prisma.homework.count({
      where: { dueDate: { gte: new Date() } },
    }),
  ]);

  const totalUnpaid =
    (unpaidFees._sum.amount || 0) - (unpaidFees._sum.paidAmount || 0);

  return {
    studentsCount,
    teachersCount,
    classesCount,
    totalUnpaid,
    todayAttendance,
    pendingHomework,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      title: "الطلاب",
      value: stats.studentsCount,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "المعلمون",
      value: stats.teachersCount,
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "الصفوف",
      value: stats.classesCount,
      icon: BookOpen,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "رسوم مستحقة",
      value: formatCurrency(stats.totalUnpaid),
      icon: Wallet,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: "حضور اليوم",
      value: stats.todayAttendance,
      icon: CalendarDays,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "واجبات قادمة",
      value: stats.pendingHomework,
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500">نظرة عامة على النظام</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-xl ${card.bg} p-3`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>آخر الإعلانات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">سيظهر هنا آخر الإعلانات المنشورة.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>النشاطات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">سيظهر هنا سجل العمليات الأخيرة.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
