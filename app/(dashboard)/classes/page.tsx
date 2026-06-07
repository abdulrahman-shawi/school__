"use client";

import { useState, useEffect } from "react";
import { getClasses, createClass, updateClass, deleteClass } from "@/lib/actions/classes";
import { getAcademicYears } from "@/lib/actions/academicYears";
import { getTeachers } from "@/lib/actions/teachers";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [c, a, t] = await Promise.all([getClasses(), getAcademicYears(), getTeachers()]);
    setClasses(c); setAcademicYears(a); setTeachers(t); setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const payload = {
      name: data.name as string,
      section: data.section as string,
      capacity: Number(data.capacity) || undefined,
      academicYearId: data.academicYearId as string,
      classTeacherId: data.classTeacherId as string || undefined,
    };
    if (editing) await updateClass(editing.id, payload);
    else await createClass(payload);
    setIsModalOpen(false); setEditing(null); loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteClass(id); loadData();
  }

  const columns = [
    { key: "name", header: "الصف" },
    { key: "section", header: "الشعبة", render: (c: any) => c.section || "-" },
    { key: "academicYear", header: "السنة", render: (c: any) => c.academicYear.name },
    { key: "classTeacher", header: "معلم الصف", render: (c: any) => c.classTeacher?.user.name || "-" },
    { key: "capacity", header: "السعة", render: (c: any) => c.capacity || "-" },
    { key: "students", header: "عدد الطلاب", render: (c: any) => c._count.students },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الصفوف الدراسية</h1>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}><Plus className="ml-2 h-4 w-4" /> صف جديد</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <DataTable columns={columns} data={classes} keyExtractor={(c) => c.id} actions={(c) => (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(c); setIsModalOpen(true); }} className="rounded p-1 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(c.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        )} />
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "تعديل صف" : "صف جديد"}>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="اسم الصف" name="name" defaultValue={editing?.name} required />
            <Input label="الشعبة" name="section" defaultValue={editing?.section} />
            <Input label="السعة" name="capacity" type="number" defaultValue={editing?.capacity} />
            <Select label="السنة الدراسية" name="academicYearId" options={academicYears.map((y) => ({ value: y.id, label: y.name }))} defaultValue={editing?.academicYearId} required />
            <Select label="معلم الصف" name="classTeacherId" options={teachers.map((t) => ({ value: t.id, label: t.user.name }))} defaultValue={editing?.classTeacherId} />
          </div>
          <div className="flex justify-end pt-4"><Button type="submit">{editing ? "حفظ" : "إضافة"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
