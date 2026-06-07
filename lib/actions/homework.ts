"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getHomework() {
  return prisma.homework.findMany({
    orderBy: { createdAt: "desc" },
    include: { class: true, subject: true, creator: true },
  });
}

export async function createHomework(data: {
  classId: string;
  subjectId: string;
  title: string;
  description?: string;
  maxMarks?: number;
  dueDate: string;
  createdBy: string;
}) {
  await prisma.homework.create({
    data: {
      ...data,
      dueDate: new Date(data.dueDate),
    },
  });
  revalidatePath("/dashboard/homework");
  return { success: true };
}

export async function updateHomework(id: string, data: any) {
  await prisma.homework.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
  revalidatePath("/dashboard/homework");
  return { success: true };
}

export async function deleteHomework(id: string) {
  await prisma.homework.delete({ where: { id } });
  revalidatePath("/dashboard/homework");
  return { success: true };
}
