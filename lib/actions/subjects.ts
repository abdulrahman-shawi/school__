"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSubjects() {
  return prisma.subject.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createSubject(data: {
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}) {
  await prisma.subject.create({ data });
  revalidatePath("/dashboard/subjects");
  return { success: true };
}

export async function updateSubject(id: string, data: any) {
  await prisma.subject.update({ where: { id }, data });
  revalidatePath("/dashboard/subjects");
  return { success: true };
}

export async function deleteSubject(id: string) {
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/dashboard/subjects");
  return { success: true };
}
