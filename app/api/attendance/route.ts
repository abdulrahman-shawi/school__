import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const classId = request.nextUrl.searchParams.get("classId");
  if (!classId) return NextResponse.json([]);
  const students = await prisma.student.findMany({
    where: { classId },
    include: { user: true },
    orderBy: { admissionNo: "asc" },
  });
  return NextResponse.json(students);
}
