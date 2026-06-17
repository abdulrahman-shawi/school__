"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTeachers() {
  return prisma.teacher.findMany({
    orderBy: { joinDate: "desc" },
    include: { user: true },
  });
}

export async function getTeacherClassesAndSubjects(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      classTeacherAssignments: { select: { id: true } },
      classTeachers: { select: { classId: true } },
      subjectTeachers: { select: { classId: true, subjectId: true } },
    },
  });

  if (!teacher) {
    return { classIds: [] as string[], classSubjects: [] as { classId: string; subjectId: string }[] };
  }

  const assignmentClassIds = teacher.classTeacherAssignments.map((c) => c.id);
  const assistantClassIds = teacher.classTeachers.map((ct) => ct.classId);
  const subjectTeacherEntries = teacher.subjectTeachers.map((st) => ({
    classId: st.classId,
    subjectId: st.subjectId,
  }));

  const classIdSet = new Set([
    ...assignmentClassIds,
    ...assistantClassIds,
    ...subjectTeacherEntries.map((e) => e.classId),
  ]);

  // أي معلم مرتبط بصف يستطيع إدخال درجات جميع مواد هذا الصف
  const classSubjectsRows = classIdSet.size > 0
    ? await prisma.classSubject.findMany({
        where: { classId: { in: Array.from(classIdSet) } },
        select: { classId: true, subjectId: true },
      })
    : [];

  const classSubjects = Array.from(
    new Set(
      [...classSubjectsRows, ...subjectTeacherEntries].map((s) => `${s.classId}|${s.subjectId}`)
    )
  ).map((key) => {
    const [classId, subjectId] = key.split("|");
    return { classId, subjectId };
  });

  return { classIds: Array.from(classIdSet), classSubjects };
}

export async function createTeacher(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  salary?: number;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "البريد الإلكتروني مستخدم مسبقاً" };

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      role: "TEACHER",
      phone: data.phone,
      address: data.address,
      teacher: {
        create: {
          qualification: data.qualification,
          specialization: data.specialization,
          experience: data.experience,
          salary: data.salary,
        },
      },
    },
  });

  revalidatePath("/dashboard/teachers");
  return { success: true, user };
}

export async function updateTeacher(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    qualification?: string;
    specialization?: string;
    experience?: number;
    salary?: number;
    isActive?: boolean;
  }
) {
  const teacher = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
  if (!teacher) return { error: "المعلم غير موجود" };

  await prisma.user.update({
    where: { id: teacher.userId },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      isActive: data.isActive,
    },
  });

  await prisma.teacher.update({
    where: { id },
    data: {
      qualification: data.qualification,
      specialization: data.specialization,
      experience: data.experience,
      salary: data.salary,
    },
  });

  revalidatePath("/dashboard/teachers");
  return { success: true };
}

export async function deleteTeacher(id: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return { error: "المعلم غير موجود" };
  await prisma.user.delete({ where: { id: teacher.userId } });
  revalidatePath("/dashboard/teachers");
  return { success: true };
}
