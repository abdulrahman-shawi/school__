"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

async function getTeacherClassIds(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      classTeacherAssignments: { select: { id: true } },
      classTeachers: { select: { classId: true } },
      subjectTeachers: { select: { classId: true } },
    },
  });

  if (!teacher) return new Set<string>();

  return new Set([
    ...teacher.classTeacherAssignments.map((c) => c.id),
    ...teacher.classTeachers.map((c) => c.classId),
    ...teacher.subjectTeachers.map((c) => c.classId),
  ]);
}

async function assertClassAllowed(classId: string | null | undefined) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  if (session.role === "ADMIN") return;
  if (!classId) throw new Error("غير مصرح");

  const allowed = await getTeacherClassIds(session.userId);
  if (!allowed.has(classId)) throw new Error("غير مصرح");
}

export async function getExams() {
  return prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      term: true,
      academicYear: true,
      class: true,
      schedules: { include: { subject: true } },
    },
  });
}

export async function getExamsForUser(userId: string, role: string) {
  if (role === "ADMIN") {
    return getExams();
  }

  if (role === "TEACHER") {
    const allowed = await getTeacherClassIds(userId);
    if (allowed.size === 0) return [];

    return prisma.exam.findMany({
      where: { classId: { in: Array.from(allowed) } },
      orderBy: { createdAt: "desc" },
      include: {
        term: true,
        academicYear: true,
        class: true,
        schedules: { include: { subject: true } },
      },
    });
  }

  return [];
}

export async function createExam(data: {
  name: string;
  type: string;
  termId: string;
  academicYearId: string;
  classId: string;
  startDate: string;
  endDate?: string;
  schedules?: { subjectId: string; examDate: string; maxMarks?: number; passMarks?: number }[];
}) {
  await assertClassAllowed(data.classId);
  await prisma.exam.create({
    data: {
      name: data.name,
      type: data.type,
      termId: data.termId,
      academicYearId: data.academicYearId,
      classId: data.classId,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      schedules: {
        create: data.schedules?.map((s) => ({
          classId: data.classId,
          subjectId: s.subjectId,
          examDate: new Date(s.examDate),
          maxMarks: s.maxMarks ?? 100,
          passMarks: s.passMarks ?? 35,
        })) || [],
      },
    },
  });
  revalidatePath("/dashboard/exams");
  return { success: true };
}

export async function updateExam(
  id: string,
  data: any & { schedules?: { subjectId: string; examDate: string; maxMarks?: number; passMarks?: number }[] }
) {
  const { schedules, ...examData } = data;

  const session = await getSession();
  if (!session) throw new Error("غير مصرح");

  if (session.role !== "ADMIN") {
    const allowed = await getTeacherClassIds(session.userId);
    const existing = await prisma.exam.findUnique({ where: { id }, select: { classId: true } });
    if (!existing || (existing.classId && !allowed.has(existing.classId))) {
      throw new Error("غير مصرح");
    }
    if (examData.classId && !allowed.has(examData.classId)) {
      throw new Error("غير مصرح");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.exam.update({
      where: { id },
      data: {
        ...examData,
        startDate: examData.startDate ? new Date(examData.startDate) : undefined,
        endDate: examData.endDate ? new Date(examData.endDate) : undefined,
      },
    });

    if (schedules) {
      await tx.examSchedule.deleteMany({ where: { examId: id } });
      if (schedules.length > 0) {
        await tx.examSchedule.createMany({
          data: schedules.map((s: any) => ({
            examId: id,
            classId: examData.classId,
            subjectId: s.subjectId,
            examDate: new Date(s.examDate),
            maxMarks: s.maxMarks ?? 100,
            passMarks: s.passMarks ?? 35,
          })),
        });
      }
    }
  });

  revalidatePath("/dashboard/exams");
  return { success: true };
}

export async function deleteExam(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");

  if (session.role !== "ADMIN") {
    const allowed = await getTeacherClassIds(session.userId);
    const existing = await prisma.exam.findUnique({ where: { id }, select: { classId: true } });
    if (!existing || (existing.classId && !allowed.has(existing.classId))) {
      throw new Error("غير مصرح");
    }
  }

  await prisma.exam.delete({ where: { id } });
  revalidatePath("/dashboard/exams");
  return { success: true };
}
