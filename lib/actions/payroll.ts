"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPayrolls() {
  return prisma.payroll.findMany({
    orderBy: { createdAt: "desc" },
    include: { teacher: { include: { user: true } } },
  });
}

export async function createPayroll(data: {
  teacherId: string;
  month: string;
  basicSalary: number;
  deductions?: number;
  bonuses?: number;
}) {
  const net = data.basicSalary - (data.deductions || 0) + (data.bonuses || 0);
  await prisma.payroll.create({
    data: {
      teacherId: data.teacherId,
      month: new Date(data.month),
      basicSalary: data.basicSalary,
      deductions: data.deductions || 0,
      bonuses: data.bonuses || 0,
      netSalary: net,
    },
  });
  revalidatePath("/dashboard/payroll");
  return { success: true };
}

export async function markPayrollPaid(id: string) {
  await prisma.payroll.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidatePath("/dashboard/payroll");
  return { success: true };
}
