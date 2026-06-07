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
