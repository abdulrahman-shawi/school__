"use client";

import { useState, useEffect } from "react";
import { getClasses } from "@/lib/actions/classes";
import { getSubjects } from "@/lib/actions/subjects";
import { getTeachers } from "@/lib/actions/teachers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DAYS_AR } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export default function TimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [c, s, t] = await Promise.all([
        getClasses(), getSubjects(), getTeachers(),
        fetch("/api/timetable").then((r) => r.json()),
      ]);
      setClasses(c); setSubjects(s); setTeachers(t);
      if (Array.isArray(t)) setEntries(t);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    fetch(`/api/timetable?classId=${selectedClass}`)
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []));
  }, [selectedClass]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/timetable", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries())),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const updated = await fetch(`/api/timetable?classId=${selectedClass}`).then((r) => r.json());
      setEntries(Array.isArray(updated) ? updated : []);
      e.currentTarget.reset();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await fetch(`/api/timetable/${id}`, { method: "DELETE" });
    const updated = await fetch(`/api/timetable?classId=${selectedClass}`).then((r) => r.json());
    setEntries(Array.isArray(updated) ? updated : []);
  }

  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الجدول المدرسي</h1>
      <div className="flex items-center gap-4">
        <Select
          label="اختر الصف"
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        />
      </div>

      {selectedClass && (
        <Card>
          <CardHeader><CardTitle>إضافة حصة</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-6">
              <Select name="day" label="اليوم" options={DAYS_AR.map((d, i) => ({ value: String(i), label: d }))} />
              <Select name="period" label="الحصة" options={periods.map((p) => ({ value: String(p), label: `الحصة ${p}` }))} />
              <Input name="startTime" label="من" type="time" />
              <Input name="endTime" label="إلى" type="time" />
              <Select name="subjectId" label="المادة" options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
              <Select name="teacherId" label="المعلم" options={teachers.map((t) => ({ value: t.id, label: t.user.name }))} />
              <input type="hidden" name="classId" value={selectedClass} />
              <div className="sm:col-span-6 flex justify-end"><Button type="submit"><Plus className="ml-2 h-4 w-4" /> إضافة</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {selectedClass && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2">اليوم / الحصة</th>{periods.map((p) => <th key={p} className="px-3 py-2">{p}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {DAYS_AR.map((day, dayIndex) => (
                <tr key={day}>
                  <td className="bg-gray-50 px-3 py-2 font-medium">{day}</td>
                  {periods.map((period) => {
                    const entry = entries.find((e) => e.day === dayIndex && e.period === period);
                    return (
                      <td key={period} className="px-2 py-2 align-top">
                        {entry ? (
                          <div className="rounded bg-blue-50 p-2 text-xs">
                            <div className="font-semibold text-blue-800">{entry.subject.name}</div>
                            <div className="text-blue-600">{entry.teacher.user.name}</div>
                            <div className="text-gray-500">{entry.startTime} - {entry.endTime}</div>
                            <button onClick={() => handleDelete(entry.id)} className="mt-1 text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
