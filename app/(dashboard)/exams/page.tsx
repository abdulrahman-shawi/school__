"use client";

import { useState, useEffect } from "react";
import { getExams, createExam, updateExam, deleteExam } from "@/lib/actions/exams";
import { getAcademicYears } from "@/lib/actions/academicYears";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [e, y] = await Promise.all([getExams(), getAcademicYears()]);
    setExams(e); setYears(y); setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const payload = {
      name: data.name as string,
      type: data.type as string,
      termId: data.termId as string,
      academicYearId: data.academicYearId as string,
      startDate: data.startDate as string,
      endDate: data.endDate as string,
    };
    if (editing) await updateExam(editing.id, payload);
    else await createExam(payload);
    setIsModalOpen(false); setEditing(null); loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteExam(id); loadData();
  }

  const columns = [
    { key: "name", header: "الامتحان" },
    { key: "type", header: "النوع" },
    { key: "academicYear", header: "السنة", render: (e: any) => e.academicYear.name },
    { key: "term", header: "الفصل", render: (e: any) => e.term?.name || "-" },
    { key: "startDate", header: "تاريخ البداية", render: (e: any) => formatDate(e.startDate) },
    { key: "endDate", header: "تاريخ النهاية", render: (e: any) => formatDate(e.endDate) },
  ];

  const terms = editing ? years.find((y) => y.id === editing.academicYearId)?.terms || [] : [];

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
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="اسم الامتحان" name="name" defaultValue={editing?.name} required />
            <Input label="النوع" name="type" defaultValue={editing?.type} placeholder="نصفي، نهائي..." required />
            <Select label="السنة الدراسية" name="academicYearId" options={years.map((y) => ({ value: y.id, label: y.name }))} defaultValue={editing?.academicYearId} required />
            <Select label="الفصل" name="termId" options={years.flatMap((y) => y.terms?.map((t: any) => ({ value: t.id, label: `${y.name} - ${t.name}` })) || [])} defaultValue={editing?.termId} required />
            <Input label="تاريخ البداية" name="startDate" type="date" defaultValue={editing?.startDate?.split("T")[0]} required />
            <Input label="تاريخ النهاية" name="endDate" type="date" defaultValue={editing?.endDate?.split("T")[0]} />
          </div>
          <div className="flex justify-end pt-4"><Button type="submit">{editing ? "حفظ" : "إضافة"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
