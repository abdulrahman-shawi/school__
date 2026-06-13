export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return `${amount.toFixed(2)} ر.س`;
}

export function formatClassName(classItem: { name: string; section?: string | null }): string {
  return classItem.section ? `${classItem.name} - ${classItem.section}` : classItem.name;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const DAYS_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export const ROLES_MAP: Record<string, string> = {
  ADMIN: "مسؤول",
  TEACHER: "معلم",
  STUDENT: "طالب",
  PARENT: "ولي أمر",
};

export const GENDER_MAP: Record<string, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
};

export const ATTENDANCE_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PRESENT: { label: "حاضر", color: "green" },
  ABSENT: { label: "غائب", color: "red" },
  LATE: { label: "متأخر", color: "yellow" },
  EXCUSED: { label: "معذور", color: "blue" },
};

export const FEE_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PAID: { label: "مدفوع", color: "green" },
  UNPAID: { label: "غير مدفوع", color: "red" },
  PARTIAL: { label: "جزئي", color: "yellow" },
};
