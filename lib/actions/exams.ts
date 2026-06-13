"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getExams() {
  return prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: { term: true, academicYear: true, class: true, schedules: true },
  });
}

export async function createExam(data: {
  name: string;
  type: string;
  termId: string;
  academicYearId: string;
  classId: string;
  startDate: string;
  endDate?: string;
}) {
  await prisma.exam.create({
    data: {
      name: data.name,
      type: data.type,
      termId: data.termId,
      academicYearId: data.academicYearId,
      classId: data.classId,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
  revalidatePath("/dashboard/exams");
  return { success: true };
}

export async function updateExam(id: string, data: any) {
  await prisma.exam.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
  revalidatePath("/dashboard/exams");
  return { success: true };
}

export async function deleteExam(id: string) {
  await prisma.exam.delete({ where: { id } });
  revalidatePath("/dashboard/exams");
  return { success: true };
}
