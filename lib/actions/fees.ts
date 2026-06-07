"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFeeTypes() {
  return prisma.feeType.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createFeeType(data: { name: string; amount: number; frequency?: string }) {
  await prisma.feeType.create({ data });
  revalidatePath("/dashboard/fees");
  return { success: true };
}

export async function updateFeeType(id: string, data: any) {
  await prisma.feeType.update({ where: { id }, data });
  revalidatePath("/dashboard/fees");
  return { success: true };
}

export async function deleteFeeType(id: string) {
  await prisma.feeType.delete({ where: { id } });
  revalidatePath("/dashboard/fees");
  return { success: true };
}

export async function getFeeCollections() {
  return prisma.feeCollection.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      student: { include: { user: true } },
      class: true,
      feeType: true,
      academicYear: true,
    },
  });
}

export async function createFeeCollection(data: {
  studentId: string;
  classId: string;
  feeTypeId: string;
  academicYearId: string;
  amount: number;
  dueDate: string;
}) {
  await prisma.feeCollection.create({
    data: {
      ...data,
      dueDate: new Date(data.dueDate),
    },
  });
  revalidatePath("/dashboard/fees");
  return { success: true };
}

export async function recordPayment(id: string, paidAmount: number) {
  const fee = await prisma.feeCollection.findUnique({ where: { id } });
  if (!fee) return { error: "الرسوم غير موجودة" };

  const newPaid = fee.paidAmount + paidAmount;
  const status = newPaid >= fee.amount ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

  await prisma.feeCollection.update({
    where: { id },
    data: {
      paidAmount: newPaid,
      status: status as any,
      paymentDate: new Date(),
      receiptNo: `REC-${Date.now()}`,
    },
  });
  revalidatePath("/dashboard/fees");
  return { success: true };
}

export async function deleteFeeCollection(id: string) {
  await prisma.feeCollection.delete({ where: { id } });
  revalidatePath("/dashboard/fees");
  return { success: true };
}
