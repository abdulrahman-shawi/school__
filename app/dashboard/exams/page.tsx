"use client";

import React, { useState, useEffect } from "react";
import { getExams, createExam, updateExam, deleteExam } from "@/lib/actions/exams";
import { getAcademicYears } from "@/lib/actions/academicYears";
import { getClasses } from "@/lib/actions/classes";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate, formatClassName } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";

function toDateInputValue(date: any): string {
  if (!date) return "";
  const value = typeof date === "string" ? date : date.toISOString ? date.toISOString() : String(date);
  return value.split("T")[0];
}

type ScheduleRow = {
  id?: string;
  subjectId: string;
  examDate: string;
  maxMarks: string;
  passMarks: string;
};

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    if (editing) {
      setSelectedClassId(editing.classId || "");
      setScheduleRows(
        (editing.schedules || []).map((s: any) => ({
          id: s.id,
          subjectId: s.subjectId,
          examDate: toDateInputValue(s.examDate),
          maxMarks: s.maxMarks != null ? String(s.maxMarks) : "100",
          passMarks: s.passMarks != null ? String(s.passMarks) : "35",
        }))
      );
    } else {
      setSelectedClassId("");
      setScheduleRows([]);
    }
  }, [isModalOpen, editing]);

  useEffect(() => {
    if (editing || !selectedClassId) return;
    const cls = classes.find((c) => c.id === selectedClassId);
    if (!cls) return;
    setScheduleRows(
      (cls.classSubjects || []).map((cs: any) => ({
        subjectId: cs.subjectId,
        examDate: "",
        maxMarks: "100",
        passMarks: "35",
      }))
    );
  }, [selectedClassId, classes, editing]);

  async function loadData() {
    setLoading(true);
    const [e, y, c] = await Promise.all([getExams(), getAcademicYears(), getClasses()]);
    setExams(e); setYears(y); setClasses(c); setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const schedules = scheduleRows
      .filter((r) => r.subjectId && r.examDate)
      .map((r) => ({
        subjectId: r.subjectId,
        examDate: r.examDate,
        maxMarks: Number(r.maxMarks) || 100,
        passMarks: Number(r.passMarks) || 35,
      }));

    const payload = {
      name: data.name as string,
      type: data.type as string,
      termId: data.termId as string,
      academicYearId: data.academicYearId as string,
      classId: data.classId as string,
      startDate: data.startDate as string,
      endDate: data.endDate as string,
      schedules,
    };

    if (editing) await updateExam(editing.id, payload);
    else await createExam(payload);

    setIsModalOpen(false);
    setEditing(null);
    setSelectedClassId("");
    setScheduleRows([]);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteExam(id); loadData();
  }

  function addScheduleRow() {
    setScheduleRows([...scheduleRows, { subjectId: "", examDate: "", maxMarks: "100", passMarks: "35" }]);
  }

  function removeScheduleRow(idx: number) {
    setScheduleRows(scheduleRows.filter((_, i) => i !== idx));
  }

  function updateScheduleRow(idx: number, field: keyof ScheduleRow, value: string) {
    setScheduleRows(scheduleRows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  const columns = [
    { key: "name", header: "الامتحان" },
    { key: "type", header: "النوع" },
    { key: "academicYear", header: "السنة", render: (e: any) => e.academicYear.name },
    { key: "term", header: "الفصل", render: (e: any) => e.term?.name || "-" },
    { key: "class", header: "الصف", render: (e: any) => (e.class ? formatClassName(e.class) : "-") },
    { key: "subjects", header: "المواد", render: (e: any) => e.schedules?.length ? e.schedules.map((s: any) => s.subject?.name).join("، ") : "-" },
    { key: "startDate", header: "تاريخ البداية", render: (e: any) => formatDate(e.startDate) },
    { key: "endDate", header: "تاريخ النهاية", render: (e: any) => formatDate(e.endDate) },
  ];

  const termOptions = years.flatMap((y) =>
    y.terms?.map((t: any) => ({ value: t.id, label: `${y.name} - ${t.name}` })) || []
  );

  const classOptions = classes.map((c: any) => ({
    value: c.id,
    label: `${c.academicYear?.name ? c.academicYear.name + " - " : ""}${formatClassName(c)}`,
  }));

  const selectedClass = classes.find((c: any) => c.id === selectedClassId);
  const subjectOptions = selectedClass
    ? (selectedClass.classSubjects || []).map((cs: any) => ({ value: cs.subjectId, label: cs.subject.name }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الامتحانات</h1>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}><Plus className="ml-2 h-4 w-4" /> امتحان جديد</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <DataTable columns={columns} data={exams} keyExtractor={(e) => e.id} actions={(e) => (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(e); setIsModalOpen(true); }} className="rounded p-1 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(e.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        )} />
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "تعديل" : "جديد"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="اسم الامتحان" name="name" defaultValue={editing?.name} required />
            <Input label="النوع" name="type" defaultValue={editing?.type} placeholder="نصفي، نهائي..." required />
            <Select label="السنة الدراسية" name="academicYearId" options={years.map((y) => ({ value: y.id, label: y.name }))} defaultValue={editing?.academicYearId} required />
            <Select label="الفصل" name="termId" options={termOptions} defaultValue={editing?.termId} required />
            <Select
              label="الصف"
              name="classId"
              options={classOptions}
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              required
            />
            <Input label="تاريخ البداية" name="startDate" type="date" defaultValue={toDateInputValue(editing?.startDate)} required />
            <Input label="تاريخ النهاية" name="endDate" type="date" defaultValue={toDateInputValue(editing?.endDate)} />
          </div>

          <div className="space-y-2 rounded border p-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">مواد الامتحان</label>
              <Button type="button" variant="outline" size="sm" onClick={addScheduleRow}>+ إضافة مادة</Button>
            </div>
            {scheduleRows.length === 0 && <p className="text-sm text-gray-500">اختر الصف لعرض مواده أو أضف مادة يدوياً.</p>}
            {scheduleRows.map((row, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-5 items-end">
                <Select
                  label="المادة"
                  options={subjectOptions}
                  value={row.subjectId}
                  onChange={(e) => updateScheduleRow(idx, "subjectId", e.target.value)}
                  required
                />
                <Input
                  label="تاريخ الامتحان"
                  type="date"
                  value={row.examDate}
                  onChange={(e) => updateScheduleRow(idx, "examDate", e.target.value)}
                  required
                />
                <Input
                  label="الدرجة العظمى"
                  type="number"
                  value={row.maxMarks}
                  onChange={(e) => updateScheduleRow(idx, "maxMarks", e.target.value)}
                />
                <Input
                  label="درجة النجاح"
                  type="number"
                  value={row.passMarks}
                  onChange={(e) => updateScheduleRow(idx, "passMarks", e.target.value)}
                />
                <Button type="button" variant="danger" size="sm" onClick={() => removeScheduleRow(idx)}>حذف</Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4"><Button type="submit">{editing ? "حفظ" : "إضافة"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
