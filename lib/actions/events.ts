"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEvents() {
  return prisma.event.findMany({
    orderBy: { startDate: "desc" },
    include: { creator: true },
  });
}

export async function createEvent(data: {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  audience?: string;
  createdBy: string;
}) {
  await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      audience: data.audience || "ALL",
      createdBy: data.createdBy,
    },
  });
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function updateEvent(id: string, data: any) {
  await prisma.event.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
  revalidatePath("/dashboard/events");
  return { success: true };
}
