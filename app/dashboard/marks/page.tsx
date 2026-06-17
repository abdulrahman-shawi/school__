"use client";

import { useState, useEffect } from "react";
import { formatClassName } from "@/lib/utils";
import { getClassesForUser } from "@/lib/actions/classes";
import { getExamsForUser } from "@/lib/actions/exams";
import { getTeacherClassesAndSubjects } from "@/lib/actions/teachers";
import { getSession } from "@/lib/auth";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function MarksPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [allowedClassIds, setAllowedClassIds] = useState<Set<string>>(new Set());
  const [allowedClassSubjects, setAllowedClassSubjects] = useState<Map<string, Set<string>>>(new Map());
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});

  const isAdmin = userRole === "ADMIN";

  useEffect(() => {
    async function load() {
      const session = await getSession();
      const uid = session?.userId || "";
      const role = session?.role || "";
      setUserRole(role);

      const [c, e, teacherData] = await Promise.all([
        uid && role ? getClassesForUser(uid, role) : [],
        uid && role ? getExamsForUser(uid, role) : [],
        role === "TEACHER" && uid ? getTeacherClassesAndSubjects(uid) : { classIds: [], classSubjects: [] },
      ]);

      setClasses(c);
      setExams(e);
      setAllowedClassIds(new Set(teacherData.classIds));

      const map = new Map<string, Set<string>>();
      teacherData.classSubjects.forEach(({ classId, subjectId }) => {
        if (!map.has(classId)) map.set(classId, new Set());
        map.get(classId)!.add(subjectId);
      });
      setAllowedClassSubjects(map);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    fetch(`/api/marks?classId=${selectedClass}&scheduleId=${selectedSchedule}`)
      .then((r) => r.json())
      .then((data) => {
        setStudents(data.students || []);
        setMarks(data.marks || {});
      });
  }, [selectedClass, selectedSchedule]);

  async function handleSave() {
    await fetch("/api/marks", {
      method: "POST",
      body: JSON.stringify({ scheduleId: selectedSchedule, marks }),
      headers: { "Content-Type": "application/json" },
    });
    alert("تم الحفظ");
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const schedules = selectedExam
    ? selectedExam.schedules.filter((s: any) => {
        if (!selectedClass || s.classId !== selectedClass) return false;
        if (isAdmin) return true;
        const allowedSubjects = allowedClassSubjects.get(s.classId);
        return allowedSubjects ? allowedSubjects.has(s.subjectId) : false;
      })
    : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">إدخال الدرجات</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="الصف" options={classes.map((c) => ({ value: c.id, label: formatClassName(c) }))} value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSchedule(""); }} />
        <Select label="الامتحان" options={exams.map((e) => ({ value: e.id, label: e.name }))} value={selectedExamId} onChange={(e) => { setSelectedExamId(e.target.value); setSelectedSchedule(""); }} />
        <Select label="المادة" options={schedules.map((s: any) => ({ value: s.id, label: `${s.subject.name} - ${formatDate(s.examDate)}` }))} value={selectedSchedule} onChange={(e) => setSelectedSchedule(e.target.value)} />
      </div>

      {selectedSchedule && (
        <Card>
          <CardHeader><CardTitle>درجات الطلاب</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded border p-3">
                  <span>{s.user.name}</span>
                  <Input
                    type="number"
                    className="w-32"
                    value={marks[s.id] || ""}
                    onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })}
                    placeholder="الدرجة"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end"><Button onClick={handleSave}>حفظ الدرجات</Button></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ar-SA");
}
