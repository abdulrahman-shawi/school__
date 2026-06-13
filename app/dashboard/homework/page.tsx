"use client";

import { useState, useEffect } from "react";
import { getHomework, createHomework, deleteHomework } from "@/lib/actions/homework";
import { getClasses } from "@/lib/actions/classes";
import { getSubjects } from "@/lib/actions/subjects";
import { getSession } from "@/lib/auth";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate, formatClassName } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export default function HomeworkPage() {
  const [homework, setHomework] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (session) setUserId(session.userId);
      const [h, c, s] = await Promise.all([getHomework(), getClasses(), getSubjects()]);
      setHomework(h); setClasses(c); setSubjects(s); setLoading(false);
    }
    init();
  }, []);

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    await createHomework({
      classId: data.classId as string,
      subjectId: data.subjectId as string,
      title: data.title as string,
      description: data.description as string,
      maxMarks: Number(data.maxMarks) || undefined,
      dueDate: data.dueDate as string,
      createdBy: userId,
    });
    setIsModalOpen(false);
    const h = await getHomework();
    setHomework(h);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteHomework(id);
    const h = await getHomework();
    setHomework(h);
  }

  const columns = [
    { key: "title", header: "الواجب" },
    { key: "class", header: "الصف", render: (h: any) => formatClassName(h.class) },
    { key: "subject", header: "المادة", render: (h: any) => h.subject.name },
    { key: "dueDate", header: "تاريخ التسليم", render: (h: any) => formatDate(h.dueDate) },
    { key: "creator", header: "منشئ", render: (h: any) => h.creator.name },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الواجبات المنزلية</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="ml-2 h-4 w-4" /> واجب جديد</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <DataTable columns={columns} data={homework} keyExtractor={(h) => h.id} actions={(h) => (
          <button onClick={() => handleDelete(h.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        )} />
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="واجب جديد">
        <form action={handleSubmit} className="space-y-4">
          <Select label="الصف" name="classId" options={classes.map((c) => ({ value: c.id, label: formatClassName(c) }))} required />
          <Select label="المادة" name="subjectId" options={subjects.map((s) => ({ value: s.id, label: s.name }))} required />
          <Input label="العنوان" name="title" required />
          <Input label="الوصف" name="description" />
          <Input label="الدرجة العظمى" name="maxMarks" type="number" />
          <Input label="تاريخ التسليم" name="dueDate" type="date" required />
          <div className="flex justify-end"><Button type="submit">إضافة</Button></div>
        </form>
      </Modal>
    </div>
  );
}
