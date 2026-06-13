"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  await prisma.exam.delete({ where: { id } });
  revalidatePath("/dashboard/exams");
  return { success: true };
}
