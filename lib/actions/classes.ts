"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("غير مصرح");
  }
}

const classInclude = {
  academicYear: true,
  classTeacher: { include: { user: true } },
  classTeachers: { include: { teacher: { include: { user: true } } } },
  classSubjects: { include: { subject: true } },
  _count: { select: { students: true, classSubjects: true, classTeachers: true } },
} as const;

export async function getClasses() {
  return prisma.class.findMany({
    orderBy: { createdAt: "desc" },
    include: classInclude,
  });
}

export async function getClassesForUser(userId: string, role: string) {
  if (role === "ADMIN") {
    return getClasses();
  }

  if (role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        classTeacherAssignments: { select: { id: true } },
        classTeachers: { select: { classId: true } },
        subjectTeachers: { select: { classId: true } },
      },
    });

    if (!teacher) return [];

    const classIds = Array.from(
      new Set([
        ...teacher.classTeacherAssignments.map((c) => c.id),
        ...teacher.classTeachers.map((c) => c.classId),
        ...teacher.subjectTeachers.map((c) => c.classId),
      ])
    );

    if (classIds.length === 0) return [];

    return prisma.class.findMany({
      where: { id: { in: classIds } },
      orderBy: { createdAt: "desc" },
      include: classInclude,
    });
  }

  return [];
}

export async function createClass(data: {
  name: string;
  section?: string;
  capacity?: number;
  academicYearId: string;
  classTeacherId?: string;
}) {
  await requireAdmin();
  await prisma.class.create({ data });
  revalidatePath("/dashboard/classes");
  return { success: true };
}

export async function updateClass(id: string, data: any) {
  await requireAdmin();
  await prisma.class.update({ where: { id }, data });
  revalidatePath("/dashboard/classes");
  return { success: true };
}

export async function deleteClass(id: string) {
  await requireAdmin();
  await prisma.class.delete({ where: { id } });
  revalidatePath("/dashboard/classes");
  return { success: true };
}

// ─── Link Subjects to Class ───

export async function getClassSubjectIds(classId: string) {
  const rows = await prisma.classSubject.findMany({
    where: { classId },
    select: { subjectId: true },
  });
  return rows.map((r) => r.subjectId);
}

export async function setClassSubjects(classId: string, subjectIds: string[]) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    await tx.classSubject.deleteMany({ where: { classId } });
    if (subjectIds.length > 0) {
      await tx.classSubject.createMany({
        data: subjectIds.map((subjectId) => ({ classId, subjectId })),
        skipDuplicates: true,
      });
    }
  });
  revalidatePath("/dashboard/classes");
  return { success: true };
}

// ─── Link Teachers to Class ───

export async function getClassTeacherIds(classId: string) {
  const rows = await prisma.classTeacher.findMany({
    where: { classId },
    select: { teacherId: true },
  });
  return rows.map((r) => r.teacherId);
}

export async function setClassTeachers(classId: string, teacherIds: string[]) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    await tx.classTeacher.deleteMany({ where: { classId } });
    if (teacherIds.length > 0) {
      await tx.classTeacher.createMany({
        data: teacherIds.map((teacherId) => ({ classId, teacherId })),
        skipDuplicates: true,
      });
    }
  });
  revalidatePath("/dashboard/classes");
  return { success: true };
}
