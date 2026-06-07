"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNotices() {
  return prisma.noticeBoard.findMany({
    orderBy: { createdAt: "desc" },
    include: { creator: true },
  });
}

export async function createNotice(data: {
  title: string;
  message: string;
  audience: string;
  priority?: string;
  expiresAt?: string;
  createdBy: string;
}) {
  await prisma.noticeBoard.create({
    data: {
      title: data.title,
      message: data.message,
      audience: data.audience,
      priority: (data.priority as any) || "NORMAL",
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      createdBy: data.createdBy,
    },
  });
  revalidatePath("/dashboard/notices");
  return { success: true };
}

export async function updateNotice(id: string, data: any) {
  await prisma.noticeBoard.update({
    where: { id },
    data: {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      priority: data.priority || "NORMAL",
    },
  });
  revalidatePath("/dashboard/notices");
  return { success: true };
}

export async function deleteNotice(id: string) {
  await prisma.noticeBoard.delete({ where: { id } });
  revalidatePath("/dashboard/notices");
  return { success: true };
}
