import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getTeacherClassesAndSubjects(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      classTeacherAssignments: { include: { classSubjects: { select: { subjectId: true } } } },
      classTeachers: { select: { classId: true } },
      subjectTeachers: { select: { classId: true, subjectId: true } },
    },
  });

  if (!teacher) {
    return { classIds: new Set<string>(), classSubjects: new Set<string>() };
  }

  const classIds = new Set([
    ...teacher.classTeacherAssignments.map((c) => c.id),
    ...teacher.classTeachers.map((ct) => ct.classId),
    ...teacher.subjectTeachers.map((st) => st.classId),
  ]);

  const assignmentSubjects = teacher.classTeacherAssignments.flatMap((c) =>
    (c.classSubjects || []).map((cs) => `${c.id}|${cs.subjectId}`)
  );
  const subjectTeacherSubjects = teacher.subjectTeachers.map((st) => `${st.classId}|${st.subjectId}`);

  const classSubjects = new Set([...assignmentSubjects, ...subjectTeacherSubjects]);

  return { classIds, classSubjects };
}

function classSubjectKey(classId: string, subjectId: string) {
  return `${classId}|${subjectId}`;
}

async function assertMarkAllowed(classId: string, subjectId?: string) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "ADMIN") return null;
  if (session.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { classIds, classSubjects } = await getTeacherClassesAndSubjects(session.userId);
  if (!classIds.has(classId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (subjectId && !classSubjects.has(classSubjectKey(classId, subjectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const classId = request.nextUrl.searchParams.get("classId");
  const scheduleId = request.nextUrl.searchParams.get("scheduleId");
  if (!classId) return NextResponse.json({ students: [], marks: {} });

  let scheduleSubjectId: string | undefined;
  if (scheduleId) {
    const schedule = await prisma.examSchedule.findUnique({ where: { id: scheduleId }, select: { subjectId: true } });
    if (schedule) scheduleSubjectId = schedule.subjectId;
  }

  const forbidden = await assertMarkAllowed(classId, scheduleSubjectId);
  if (forbidden) return forbidden;

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

  const forbidden = await assertMarkAllowed(schedule.classId, schedule.subjectId);
  if (forbidden) return forbidden;

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
