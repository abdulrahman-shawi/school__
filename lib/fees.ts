"use server";

import { prisma } from "./prisma";

const MONTHLY_FEE_TYPE_NAME = "الرسوم الشهرية";

/**
 * Get or create the monthly fee type record.
 */
export async function getMonthlyFeeType() {
  let feeType = await prisma.feeType.findFirst({
    where: { frequency: "monthly" },
  });

  if (!feeType) {
    feeType = await prisma.feeType.create({
      data: {
        name: MONTHLY_FEE_TYPE_NAME,
        amount: 0,
        frequency: "monthly",
      },
    });
  }

  return feeType;
}

/**
 * Return the start and end of a given month.
 */
export async function getMonthRange(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Find the monthly fee collection for a student in a given month.
 */
export async function getStudentMonthlyCollection(studentId: string, date: Date) {
  const { start, end } = await getMonthRange(date);
  const feeType = await getMonthlyFeeType();

  const collection = await prisma.feeCollection.findFirst({
    where: {
      studentId,
      feeTypeId: feeType.id,
      dueDate: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return collection;
}

export type MonthlyFeeStatus = {
  studentId: string;
  monthlyFee: number;
  dueAmount: number;
  paidAmount: number;
  status: "PAID" | "PARTIAL" | "UNPAID";
  extensionUntil: Date | null;
  isAccessAllowed: boolean;
  monthLabel: string;
};

/**
 * Get the monthly fee status for a list of students.
 */
export async function getStudentsMonthlyFeeStatus(studentIds?: string[]): Promise<MonthlyFeeStatus[]> {
  const where = studentIds && studentIds.length > 0 ? { id: { in: studentIds } } : {};

  const students = await prisma.student.findMany({
    where,
    include: { user: true, class: true },
  });

  const now = new Date();
  const { start } = await getMonthRange(now);
  const monthLabel = now.toLocaleDateString("ar-SA", { year: "numeric", month: "long" });

  const result: MonthlyFeeStatus[] = [];

  for (const student of students) {
    const monthlyFee = student.monthlyFee ?? 0;
    const collection = monthlyFee > 0 ? await getStudentMonthlyCollection(student.id, now) : null;

    const paidAmount = collection?.paidAmount ?? 0;
    const dueAmount = Math.max(monthlyFee - paidAmount, 0);
    const status: MonthlyFeeStatus["status"] =
      monthlyFee <= 0 || paidAmount >= monthlyFee
        ? "PAID"
        : paidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

    const extensionUntil = student.feeExtensionUntil ?? null;
    const isExtensionActive = extensionUntil ? new Date(extensionUntil) >= now : false;
    const isAccessAllowed = status === "PAID" || isExtensionActive;

    result.push({
      studentId: student.id,
      monthlyFee,
      dueAmount,
      paidAmount,
      status,
      extensionUntil,
      isAccessAllowed,
      monthLabel,
    });
  }

  return result;
}

/**
 * Check whether a student is allowed to access the system based on monthly fees.
 */
export async function isStudentFeeAccessAllowed(studentId: string): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { monthlyFee: true, feeExtensionUntil: true },
  });

  if (!student) return true;

  const monthlyFee = student.monthlyFee ?? 0;
  if (monthlyFee <= 0) return true;

  const now = new Date();
  if (student.feeExtensionUntil && new Date(student.feeExtensionUntil) >= now) {
    return true;
  }

  const collection = await getStudentMonthlyCollection(studentId, now);
  if (collection && collection.paidAmount >= monthlyFee) {
    return true;
  }

  return false;
}

/**
 * Check whether a parent is allowed to access the system based on their children's fees.
 */
export async function isParentFeeAccessAllowed(parentId: string): Promise<boolean> {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: { students: { select: { id: true } } },
  });

  if (!parent) return true;

  for (const student of parent.students) {
    const allowed = await isStudentFeeAccessAllowed(student.id);
    if (!allowed) return false;
  }

  return true;
}

/**
 * Record a monthly fee payment for a student for the current month.
 */
export async function recordMonthlyFeePayment(studentId: string, paidAmount: number) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });

  if (!student) return { error: "الطالب غير موجود" };
  if (!student.classId) return { error: "الطالب غير مسجل في صف" };

  const monthlyFee = student.monthlyFee ?? 0;
  if (monthlyFee <= 0) return { error: "الطالب ليس لديه رسوم شهرية محددة" };

  const feeType = await getMonthlyFeeType();
  const now = new Date();
  const { start, end } = await getMonthRange(now);

  let collection = await prisma.feeCollection.findFirst({
    where: {
      studentId,
      feeTypeId: feeType.id,
      dueDate: { gte: start, lte: end },
    },
  });

  const academicYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
    orderBy: { startDate: "desc" },
  });

  if (!academicYear) return { error: "لا توجد سنة دراسية حالية" };

  if (!collection) {
    collection = await prisma.feeCollection.create({
      data: {
        studentId,
        classId: student.classId,
        feeTypeId: feeType.id,
        academicYearId: academicYear.id,
        amount: monthlyFee,
        paidAmount: 0,
        dueDate: end,
        status: "UNPAID",
      },
    });
  }

  const newPaid = collection.paidAmount + paidAmount;
  const status = newPaid >= collection.amount ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

  await prisma.feeCollection.update({
    where: { id: collection.id },
    data: {
      paidAmount: newPaid,
      status: status as any,
      paymentDate: new Date(),
      receiptNo: `REC-${Date.now()}`,
    },
  });

  return { success: true };
}

/**
 * Update the fee extension date for a student.
 */
export async function updateStudentFeeExtension(studentId: string, extensionUntil?: string | null) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "الطالب غير موجود" };

  await prisma.student.update({
    where: { id: studentId },
    data: {
      feeExtensionUntil: extensionUntil ? new Date(extensionUntil) : null,
    },
  });

  return { success: true };
}
