"use client";

import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth";
import { getStudents } from "@/lib/actions/students";
import { getTeachers } from "@/lib/actions/teachers";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, ExternalLink } from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (session) setUserId(session.userId);
      const [d, s, t] = await Promise.all([
        fetch("/api/documents").then((r) => r.json()),
        getStudents(),
        getTeachers(),
      ]);
      setDocuments(Array.isArray(d) ? d : []);
      setStudents(s); setTeachers(t); setLoading(false);
    }
    init();
  }, []);

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    await fetch("/api/documents", {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        fileUrl: data.fileUrl,
        category: data.category,
        entityType: data.entityType,
        entityId: data.entityId,
        uploadedBy: userId,
      }),
      headers: { "Content-Type": "application/json" },
    });
    setIsModalOpen(false);
    const d = await fetch("/api/documents").then((r) => r.json());
    setDocuments(Array.isArray(d) ? d : []);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    const d = await fetch("/api/documents").then((r) => r.json());
    setDocuments(Array.isArray(d) ? d : []);
  }

  const columns = [
    { key: "title", header: "العنوان" },
    { key: "category", header: "التصنيف", render: (d: any) => d.category || "-" },
    { key: "entityType", header: "الجهة" },
    { key: "createdAt", header: "التاريخ", render: (d: any) => formatDate(d.createdAt) },
  ];

  const entityOptions =
    documents.find((d) => d.entityType === "STUDENT")
      ? students.map((s) => ({ value: s.id, label: s.user.name }))
      : teachers.map((t) => ({ value: t.id, label: t.user.name }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المستندات</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="ml-2 h-4 w-4" /> مستند جديد</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <DataTable columns={columns} data={documents} keyExtractor={(d) => d.id} actions={(d) => (
          <div className="flex gap-2">
            <a href={d.fileUrl} target="_blank" className="rounded p-1 text-blue-600 hover:bg-blue-50"><ExternalLink className="h-4 w-4" /></a>
            <button onClick={() => handleDelete(d.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        )} />
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="مستند جديد">
        <form action={handleSubmit} className="space-y-4">
          <Input label="العنوان" name="title" required />
          <Input label="رابط الملف" name="fileUrl" required />
          <Input label="التصنيف" name="category" placeholder="شهادة، تقرير..." />
          <Select label="الجهة" name="entityType" options={[
            { value: "GENERAL", label: "عام" },
            { value: "STUDENT", label: "طالب" },
            { value: "TEACHER", label: "معلم" },
          ]} />
          <div className="flex justify-end"><Button type="submit">إضافة</Button></div>
        </form>
      </Modal>
    </div>
  );
}
