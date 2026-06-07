"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBehaviorRecords() {
  return prisma.behaviorRecord.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      student: { include: { user: true, class: true } },
      recorder: true,
    },
  });
}

export async function createBehaviorRecord(data: {
  studentId: string;
  type: string;
  category: string;
  description: string;
  points?: number;
  recordedBy: string;
}) {
  await prisma.behaviorRecord.create({
    data: {
      studentId: data.studentId,
      type: data.type as any,
      category: data.category,
      description: data.description,
      points: data.points || 0,
      recordedBy: data.recordedBy,
    },
  });
  revalidatePath("/dashboard/behavior");
  return { success: true };
}

export async function deleteBehaviorRecord(id: string) {
  await prisma.behaviorRecord.delete({ where: { id } });
  revalidatePath("/dashboard/behavior");
  return { success: true };
}
