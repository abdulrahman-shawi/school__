import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const classId = request.nextUrl.searchParams.get("classId");
  const scheduleId = request.nextUrl.searchParams.get("scheduleId");
  if (!classId) return NextResponse.json({ students: [], marks: {} });

  const students = await prisma.student.findMany({
    where: { classId },
    include: { user: true },
  });

  let marks: Record<string, number> = {};
  if (scheduleId) {
    const existing = await prisma.mark.findMany({ where: { examScheduleId: scheduleId } });
    existing.forEach((m) => { marks[m.studentId] = m.marksObtained; });
  }

  return NextResponse.json({ students, marks });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { scheduleId, marks } = body;
  if (!scheduleId) return NextResponse.json({ error: "scheduleId required" }, { status: 400 });

  const schedule = await prisma.examSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  for (const [studentId, value] of Object.entries(marks)) {
    const marksObtained = Number(value);
    if (Number.isNaN(marksObtained)) continue;
    const percentage = (marksObtained / schedule.maxMarks) * 100;
    const grade = await calculateGrade(percentage);

    await prisma.mark.upsert({
      where: { studentId_examScheduleId: { studentId, examScheduleId: scheduleId } },
      create: {
        studentId,
        examScheduleId: scheduleId,
        subjectId: schedule.subjectId,
        marksObtained,
        totalMarks: schedule.maxMarks,
        percentage,
        grade,
      },
      update: { marksObtained, totalMarks: schedule.maxMarks, percentage, grade },
    });
  }

  return NextResponse.json({ success: true });
}

async function calculateGrade(percentage: number): Promise<string> {
  const grades = await prisma.markGrade.findMany({ orderBy: { percentageFrom: "desc" } });
  const match = grades.find((g) => percentage >= g.percentageFrom && percentage <= g.percentageTo);
  return match?.grade || "";
}
