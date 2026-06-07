"use client";

import { useState, useEffect } from "react";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "@/lib/actions/subjects";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { loadSubjects(); }, []);

  async function loadSubjects() {
    setLoading(true);
    const data = await getSubjects();
    setSubjects(data); setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const payload = {
      name: data.name as string,
      code: data.code as string,
      description: data.description as string,
      isActive: data.isActive === "true",
    };
    if (editing) await updateSubject(editing.id, payload);
    else await createSubject(payload);
    setIsModalOpen(false); setEditing(null); loadSubjects();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteSubject(id); loadSubjects();
  }

  const columns = [
    { key: "name", header: "المادة" },
    { key: "code", header: "الكود", render: (s: any) => s.code || "-" },
    { key: "description", header: "الوصف", render: (s: any) => s.description || "-" },
    { key: "isActive", header: "الحالة", render: (s: any) => <Badge variant={s.isActive ? "success" : "danger"}>{s.isActive ? "نشطة" : "معطلة"}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المواد الدراسية</h1>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}><Plus className="ml-2 h-4 w-4" /> مادة جديدة</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <DataTable columns={columns} data={subjects} keyExtractor={(s) => s.id} actions={(s) => (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(s); setIsModalOpen(true); }} className="rounded p-1 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(s.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        )} />
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "تعديل" : "جديد"}>
        <form action={handleSubmit} className="space-y-4">
          <Input label="اسم المادة" name="name" defaultValue={editing?.name} required />
          <Input label="الكود" name="code" defaultValue={editing?.code} />
          <Input label="الوصف" name="description" defaultValue={editing?.description} />
          <Select label="الحالة" name="isActive" options={[{ value: "true", label: "نشطة" }, { value: "false", label: "معطلة" }]} defaultValue={String(editing?.isActive ?? true)} />
          <div className="flex justify-end pt-4"><Button type="submit">{editing ? "حفظ" : "إضافة"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
