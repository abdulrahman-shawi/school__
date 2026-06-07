"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUsers(role?: string) {
  return prisma.user.findMany({
    where: role ? { role: role as any } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      admin: true,
      teacher: true,
      student: { include: { class: true, parent: { include: { user: true } } } },
      parent: { include: { students: { include: { user: true, class: true } } } },
    },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  address?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "البريد الإلكتروني مستخدم مسبقاً" };

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      role: data.role as any,
      phone: data.phone,
      address: data.address,
    },
  });

  revalidatePath("/dashboard/users");
  return { success: true, user };
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
    password?: string;
  }
) {
  const updateData: any = { ...data };
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  } else {
    delete updateData.password;
  }

  await prisma.user.update({ where: { id }, data: updateData });
  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/dashboard/users");
  return { success: true };
}
