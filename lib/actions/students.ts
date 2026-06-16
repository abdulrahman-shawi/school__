"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getStudents() {
  return prisma.student.findMany({
    orderBy: { enrollmentDate: "desc" },
    include: {
      user: true,
      class: true,
      parent: { include: { user: true } },
    },
  });
}

export async function getStudentsForUser(userId: string, role: string) {
  if (role === "ADMIN") {
    return getStudents();
  }

  if (role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        classTeacherAssignments: { select: { id: true } },
        classTeachers: { select: { classId: true } },
        subjectTeachers: { select: { classId: true } },
      },
    });

    if (!teacher) return [];

    const classIds = Array.from(
      new Set([
        ...teacher.classTeacherAssignments.map((c) => c.id),
        ...teacher.classTeachers.map((c) => c.classId),
        ...teacher.subjectTeachers.map((c) => c.classId),
      ])
    );

    if (classIds.length === 0) return [];

    return prisma.student.findMany({
      where: { classId: { in: classIds } },
      orderBy: { enrollmentDate: "desc" },
      include: {
        user: true,
        class: true,
        parent: { include: { user: true } },
      },
    });
  }

  return [];
}

export async function createStudent(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  admissionNo: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  previousSchool?: string;
  classId?: string;
  parentId?: string;
  monthlyFee?: number;
  feeExtensionUntil?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "البريد الإلكتروني مستخدم مسبقاً" };

  const existingNo = await prisma.student.findUnique({ where: { admissionNo: data.admissionNo } });
  if (existingNo) return { error: "رقم القيد مستخدم مسبقاً" };

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      role: "STUDENT",
      phone: data.phone,
      address: data.address,
      student: {
        create: {
          admissionNo: data.admissionNo,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          gender: data.gender as any,
          bloodGroup: data.bloodGroup,
          previousSchool: data.previousSchool,
          classId: data.classId || undefined,
          parentId: data.parentId || undefined,
          monthlyFee: data.monthlyFee ?? undefined,
          feeExtensionUntil: data.feeExtensionUntil ? new Date(data.feeExtensionUntil) : undefined,
        },
      },
    },
  });

  revalidatePath("/dashboard/students");
  return { success: true, user };
}

export async function updateStudent(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    admissionNo?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    previousSchool?: string;
    classId?: string;
    parentId?: string;
    isActive?: boolean;
    monthlyFee?: number;
    feeExtensionUntil?: string;
  }
) {
  const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
  if (!student) return { error: "الطالب غير موجود" };

  await prisma.user.update({
    where: { id: student.userId },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      isActive: data.isActive,
    },
  });

  await prisma.student.update({
    where: { id },
    data: {
      admissionNo: data.admissionNo,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender as any,
      bloodGroup: data.bloodGroup,
      previousSchool: data.previousSchool,
      classId: data.classId || undefined,
      parentId: data.parentId || undefined,
      monthlyFee: data.monthlyFee ?? undefined,
      feeExtensionUntil: data.feeExtensionUntil ? new Date(data.feeExtensionUntil) : undefined,
    },
  });

  revalidatePath("/dashboard/students");
  return { success: true };
}

export async function deleteStudent(id: string) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return { error: "الطالب غير موجود" };
  await prisma.user.delete({ where: { id: student.userId } });
  revalidatePath("/dashboard/students");
  return { success: true };
}
