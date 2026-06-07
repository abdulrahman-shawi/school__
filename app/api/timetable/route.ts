import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const classId = request.nextUrl.searchParams.get("classId");
  if (!classId) return NextResponse.json([]);
  const entries = await prisma.classTimetable.findMany({
    where: { classId },
    include: { subject: true, teacher: { include: { user: true } }, class: true },
    orderBy: [{ day: "asc" }, { period: "asc" }],
  });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const entry = await prisma.classTimetable.create({
    data: {
      day: Number(body.day),
      period: Number(body.period),
      startTime: body.startTime,
      endTime: body.endTime,
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: body.teacherId,
    },
  });
  return NextResponse.json(entry);
}
