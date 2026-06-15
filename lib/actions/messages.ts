"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMessages(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: { select: { classId: true } },
      parent: { include: { students: { select: { classId: true } } } },
      teacher: {
        include: {
          classTeachers: { select: { classId: true } },
          subjectTeachers: { select: { classId: true } },
          classTeacherAssignments: { select: { id: true } },
        },
      },
    },
  });

  const classIds = new Set<string>();
  if (user?.student?.classId) classIds.add(user.student.classId);
  if (user?.parent?.students) {
    user.parent.students.forEach((s) => { if (s.classId) classIds.add(s.classId); });
  }
  if (user?.teacher) {
    user.teacher.classTeachers.forEach((c) => classIds.add(c.classId));
    user.teacher.subjectTeachers.forEach((c) => classIds.add(c.classId));
    user.teacher.classTeacherAssignments.forEach((c) => classIds.add(c.id));
  }

  const where: any = {
    OR: [
      { senderId: userId },
      { receiverId: userId },
      ...(user?.role === "ADMIN"
        ? [{ receiverId: null }]
        : classIds.size > 0
          ? [{ receiverId: null, classId: { in: Array.from(classIds) } }]
          : []),
    ],
  };

  return prisma.message.findMany({
    where,
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
  receiverId?: string;
  classId: string;
  subjectId?: string;
  content: string;
}) {
  await prisma.message.create({
    data: {
      ...data,
      receiverId: data.receiverId || null,
      messageType: "TEXT",
    },
  });
  revalidatePath("/dashboard/messages");
  return { success: true };
}

export async function markAsRead(id: string) {
  await prisma.message.update({ where: { id }, data: { readAt: new Date() } });
  revalidatePath("/dashboard/messages");
  return { success: true };
}
