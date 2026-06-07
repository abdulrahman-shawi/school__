"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLeaves() {
  return prisma.leave.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
}

export async function createLeave(data: {
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
}) {
  await prisma.leave.create({
    data: {
      userId: data.userId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
    },
  });
  revalidatePath("/dashboard/leaves");
  return { success: true };
}

export async function updateLeaveStatus(id: string, status: string, approvedBy?: string) {
  await prisma.leave.update({
    where: { id },
    data: { status: status as any, approvedBy },
  });
  revalidatePath("/dashboard/leaves");
  return { success: true };
}
