"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMessages(userId: string) {
  return prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: true,
      receiver: true,
      class: true,
      subject: true,
    },
  });
}

export async function createMessage(data: {
  senderId: string;
  receiverId: string;
  classId: string;
  subjectId?: string;
  content: string;
}) {
  await prisma.message.create({ data });
  revalidatePath("/dashboard/messages");
  return { success: true };
}

export async function markAsRead(id: string) {
  await prisma.message.update({ where: { id }, data: { readAt: new Date() } });
  revalidatePath("/dashboard/messages");
  return { success: true };
}
