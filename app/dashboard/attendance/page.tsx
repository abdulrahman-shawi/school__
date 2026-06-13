"use client";

import { useState, useEffect } from "react";
import { getClasses } from "@/lib/actions/classes";
import { getAttendanceByClassAndDate, markAttendance } from "@/lib/actions/attendance";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ATTENDANCE_STATUS_MAP, formatClassName } from "@/lib/utils";

export default function AttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  useEffect(() => {
    getClasses().then(setClasses);
  }, []);

  useEffect(() => {
    if (!selectedClass || !date) return;
    loadAttendance();
  }, [selectedClass, date]);

  async function loadAttendance() {
    const data = await getAttendanceByClassAndDate(selectedClass, date);
    const att: Record<string, string> = {};
    const rem: Record<string, string> = {};
    data.forEach((a: any) => {
      att[a.studentId] = a.status;
      rem[a.studentId] = a.remarks || "";
    });
    setAttendance(att);
    setRemarks(rem);

    const classStudents = await fetch(`/api/attendance?classId=${selectedClass}`).then((r) => r.json());
    setStudents(classStudents);
  }

  async function handleSave() {
    const records = students.map((s) => ({
      studentId: s.id,
      classId: selectedClass,
      date,
      status: attendance[s.id] || "PRESENT",
      remarks: remarks[s.id],
    }));
    await markAttendance(records);
    alert("تم حفظ الحضور");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">تسجيل الحضور</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="الصف" options={classes.map((c) => ({ value: c.id, label: formatClassName(c) }))} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} />
        <Input label="التاريخ" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {selectedClass && (
        <Card>
          <CardHeader><CardTitle>قائمة الطلاب</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded border p-3">
                  <span className="flex-1">{s.user.name}</span>
                  <div className="flex gap-1">
                    {Object.entries(ATTENDANCE_STATUS_MAP).map(([key, { label, color }]) => (
                      <button
                        key={key}
                        onClick={() => setAttendance({ ...attendance, [s.id]: key })}
                        className={`rounded px-3 py-1 text-xs font-medium ${attendance[s.id] === key ? `bg-${color}-600 text-white` : "bg-gray-100 text-gray-700"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="ملاحظة"
                    value={remarks[s.id] || ""}
                    onChange={(e) => setRemarks({ ...remarks, [s.id]: e.target.value })}
                    className="w-40 rounded border px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end"><Button onClick={handleSave}>حفظ الحضور</Button></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
