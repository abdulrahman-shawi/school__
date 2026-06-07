"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClasses() {
  return prisma.class.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      academicYear: true,
      classTeacher: { include: { user: true } },
      _count: { select: { students: true, classSubjects: true } },
    },
  });
}

export async function createClass(data: {
  name: string;
  section?: string;
  capacity?: number;
  academicYearId: string;
  classTeacherId?: string;
}) {
  await prisma.class.create({ data });
  revalidatePath("/dashboard/classes");
  return { success: true };
}

export async function updateClass(id: string, data: any) {
  await prisma.class.update({ where: { id }, data });
  revalidatePath("/dashboard/classes");
  return { success: true };
}

export async function deleteClass(id: string) {
  await prisma.class.delete({ where: { id } });
  revalidatePath("/dashboard/classes");
  return { success: true };
}
