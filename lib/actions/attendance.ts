"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAttendanceByClassAndDate(classId: string, date: string) {
  const d = new Date(date);
  return prisma.attendance.findMany({
    where: {
      classId,
      date: {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lt: new Date(d.setHours(23, 59, 59, 999)),
      },
    },
    include: { student: { include: { user: true } } },
  });
}

export async function markAttendance(records: {
  studentId: string;
  classId: string;
  date: string;
  status: string;
  remarks?: string;
}[]) {
  for (const record of records) {
    await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: record.studentId,
          date: new Date(record.date),
        },
      },
      create: {
        studentId: record.studentId,
        classId: record.classId,
        date: new Date(record.date),
        status: record.status as any,
        remarks: record.remarks,
      },
      update: {
        status: record.status as any,
        remarks: record.remarks,
      },
    });
  }
  revalidatePath("/dashboard/attendance");
  return { success: true };
}
