"use client";

import { useState, useEffect } from "react";
import { getBehaviorRecords, createBehaviorRecord, deleteBehaviorRecord } from "@/lib/actions/behavior";
import { getSession } from "@/lib/auth";
import { getStudents } from "@/lib/actions/students";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export default function BehaviorPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (session) setUserId(session.userId);
      const [r, s] = await Promise.all([getBehaviorRecords(), getStudents()]);
      setRecords(r); setStudents(s); setLoading(false);
    }
    init();
  }, []);

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    await createBehaviorRecord({
      studentId: data.studentId as string,
      type: data.type as string,
      category: data.category as string,
      description: data.description as string,
      points: Number(data.points) || 0,
      recordedBy: userId,
    });
    setIsModalOpen(false);
    const r = await getBehaviorRecords();
    setRecords(r);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteBehaviorRecord(id);
    const r = await getBehaviorRecords();
    setRecords(r);
  }

  const columns = [
    { key: "student", header: "الطالب", render: (r: any) => r.student.user.name },
    { key: "class", header: "الصف", render: (r: any) => r.student.class?.name || "-" },
    { key: "type", header: "النوع", render: (r: any) => <Badge variant={r.type === "POSITIVE" ? "success" : "danger"}>{r.type === "POSITIVE" ? "إيجابي" : "سلبي"}</Badge> },
    { key: "category", header: "التصنيف" },
    { key: "description", header: "الوصف" },
    { key: "points", header: "النقاط" },
    { key: "createdAt", header: "التاريخ", render: (r: any) => formatDate(r.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">سجل السلوك</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="ml-2 h-4 w-4" /> سجل جديد</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : <DataTable columns={columns} data={records} keyExtractor={(r) => r.id} actions={(r) => <button onClick={() => handleDelete(r.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>} />}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="سجل سلوك جديد">
        <form action={handleSubmit} className="space-y-4">
          <Select label="الطالب" name="studentId" options={students.map((s) => ({ value: s.id, label: s.user.name }))} required />
          <Select label="النوع" name="type" options={[{ value: "POSITIVE", label: "إيجابي" }, { value: "NEGATIVE", label: "سلبي" }]} required />
          <Input label="التصنيف" name="category" placeholder="انضباط، إنجاز..." required />
          <textarea name="description" required placeholder="الوصف" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} />
          <Input label="النقاط" name="points" type="number" defaultValue="0" />
          <div className="flex justify-end"><Button type="submit">إضافة</Button></div>
        </form>
      </Modal>
    </div>
  );
}
