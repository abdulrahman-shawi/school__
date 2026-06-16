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

export async function getSubjects() {
  return prisma.subject.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getSubjectsForUser(userId: string, role: string) {
  if (role === "ADMIN") {
    return getSubjects();
  }

  if (role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        subjectTeachers: { select: { subjectId: true } },
      },
    });

    if (!teacher) return [];

    const subjectIds = Array.from(
      new Set(teacher.subjectTeachers.map((s) => s.subjectId))
    );

    if (subjectIds.length === 0) return [];

    return prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      orderBy: { createdAt: "desc" },
    });
  }

  return [];
}

export async function createSubject(data: {
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}) {
  await requireAdmin();
  await prisma.subject.create({ data });
  revalidatePath("/dashboard/subjects");
  return { success: true };
}

export async function updateSubject(id: string, data: any) {
  await requireAdmin();
  await prisma.subject.update({ where: { id }, data });
  revalidatePath("/dashboard/subjects");
  return { success: true };
}

export async function deleteSubject(id: string) {
  await requireAdmin();
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/dashboard/subjects");
  return { success: true };
}
