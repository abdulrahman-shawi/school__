"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getParents() {
  return prisma.parent.findMany({
    orderBy: { user: { name: "asc" } },
    include: {
      user: true,
      students: { include: { user: true, class: true } },
    },
  });
}

export async function createParent(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  occupation?: string;
  relation?: string;
  emergencyPhone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "البريد الإلكتروني مستخدم مسبقاً" };

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      role: "PARENT",
      phone: data.phone,
      address: data.address,
      parent: {
        create: {
          occupation: data.occupation,
          relation: data.relation,
          emergencyPhone: data.emergencyPhone,
        },
      },
    },
  });

  revalidatePath("/dashboard/parents");
  return { success: true, user };
}

export async function updateParent(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    occupation?: string;
    relation?: string;
    emergencyPhone?: string;
    isActive?: boolean;
  }
) {
  const parent = await prisma.parent.findUnique({ where: { id }, include: { user: true } });
  if (!parent) return { error: "ولي الأمر غير موجود" };

  await prisma.user.update({
    where: { id: parent.userId },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      isActive: data.isActive,
    },
  });

  await prisma.parent.update({
    where: { id },
    data: {
      occupation: data.occupation,
      relation: data.relation,
      emergencyPhone: data.emergencyPhone,
    },
  });

  revalidatePath("/dashboard/parents");
  return { success: true };
}

export async function deleteParent(id: string) {
  const parent = await prisma.parent.findUnique({ where: { id } });
  if (!parent) return { error: "ولي الأمر غير موجود" };
  await prisma.user.delete({ where: { id: parent.userId } });
  revalidatePath("/dashboard/parents");
  return { success: true };
}
