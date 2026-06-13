"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAcademicYears() {
  return prisma.academicYear.findMany({
    orderBy: { startDate: "desc" },
    include: { terms: { orderBy: { startDate: "asc" } } },
  });
}

export async function createAcademicYear(data: {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}) {
  if (data.isCurrent) {
    await prisma.academicYear.updateMany({ data: { isCurrent: false } });
  }
  await prisma.academicYear.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isCurrent: data.isCurrent || false,
    },
  });
  revalidatePath("/dashboard/academic-years");
  return { success: true };
}

export async function updateAcademicYear(
  id: string,
  data: { name?: string; startDate?: string; endDate?: string; isCurrent?: boolean }
) {
  if (data.isCurrent) {
    await prisma.academicYear.updateMany({ data: { isCurrent: false } });
  }
  await prisma.academicYear.update({
    where: { id },
    data: {
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      isCurrent: data.isCurrent,
    },
  });
  revalidatePath("/dashboard/academic-years");
  return { success: true };
}

export async function deleteAcademicYear(id: string) {
  await prisma.academicYear.delete({ where: { id } });
  revalidatePath("/dashboard/academic-years");
  return { success: true };
}
