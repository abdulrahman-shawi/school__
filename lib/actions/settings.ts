"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  return prisma.setting.findMany();
}

export async function getSetting(key: string) {
  return prisma.setting.findUnique({ where: { key } });
}

export async function upsertSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  revalidatePath("/dashboard/settings");
  return { success: true };
}
