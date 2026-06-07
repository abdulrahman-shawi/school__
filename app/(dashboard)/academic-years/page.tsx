"use client";

import { useState, useEffect } from "react";
import { getAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear } from "@/lib/actions/academicYears";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AcademicYearsPage() {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await getAcademicYears();
    setYears(data); setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const payload = {
      name: data.name as string,
      startDate: data.startDate as string,
      endDate: data.endDate as string,
      isCurrent: data.isCurrent === "true",
    };
    if (editing) await updateAcademicYear(editing.id, payload);
    else await createAcademicYear(payload);
    setIsModalOpen(false); setEditing(null); loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteAcademicYear(id); loadData();
  }

  const columns = [
    { key: "name", header: "السنة" },
    { key: "startDate", header: "تاريخ البداية", render: (y: any) => formatDate(y.startDate) },
    { key: "endDate", header: "تاريخ النهاية", render: (y: any) => formatDate(y.endDate) },
    { key: "isCurrent", header: "الحالية", render: (y: any) => y.isCurrent ? <Badge variant="success">الحالية</Badge> : "-" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">السنوات الدراسية</h1>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}><Plus className="ml-2 h-4 w-4" /> سنة جديدة</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <DataTable columns={columns} data={years} keyExtractor={(y) => y.id} actions={(y) => (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(y); setIsModalOpen(true); }} className="rounded p-1 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(y.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        )} />
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "تعديل" : "جديد"}>
        <form action={handleSubmit} className="space-y-4">
          <Input label="اسم السنة" name="name" defaultValue={editing?.name} placeholder="مثال: 2025-2026" required />
          <Input label="تاريخ البداية" name="startDate" type="date" defaultValue={editing?.startDate?.split("T")[0]} required />
          <Input label="تاريخ النهاية" name="endDate" type="date" defaultValue={editing?.endDate?.split("T")[0]} required />
          <Select label="السنة الحالية" name="isCurrent" options={[{ value: "true", label: "نعم" }, { value: "false", label: "لا" }]} defaultValue={String(editing?.isCurrent ?? false)} />
          <div className="flex justify-end pt-4"><Button type="submit">{editing ? "حفظ" : "إضافة"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
