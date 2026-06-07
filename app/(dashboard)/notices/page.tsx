"use client";

import { useState, useEffect } from "react";
import { getNotices, createNotice, deleteNotice } from "@/lib/actions/notices";
import { getSession } from "@/lib/auth";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

const priorityVariants: Record<string, any> = {
  LOW: "default",
  NORMAL: "info",
  HIGH: "warning",
  URGENT: "danger",
};

const priorityLabels: Record<string, string> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "عالية",
  URGENT: "عاجلة",
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (session) setUserId(session.userId);
      loadNotices();
    }
    init();
  }, []);

  async function loadNotices() {
    setLoading(true);
    const data = await getNotices();
    setNotices(data); setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    await createNotice({
      title: data.title as string,
      message: data.message as string,
      audience: data.audience as string,
      priority: data.priority as string,
      expiresAt: data.expiresAt as string,
      createdBy: userId,
    });
    setIsModalOpen(false); loadNotices();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteNotice(id); loadNotices();
  }

  const columns = [
    { key: "title", header: "العنوان" },
    { key: "audience", header: "الجمهور" },
    { key: "priority", header: "الأولوية", render: (n: any) => <Badge variant={priorityVariants[n.priority] || "default"}>{priorityLabels[n.priority] || n.priority}</Badge> },
    { key: "expiresAt", header: "تاريخ الانتهاء", render: (n: any) => formatDate(n.expiresAt) },
    { key: "creator", header: "منشئ", render: (n: any) => n.creator.name },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">لوحة الإعلانات</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="ml-2 h-4 w-4" /> إعلان جديد</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <DataTable columns={columns} data={notices} keyExtractor={(n) => n.id} actions={(n) => (
          <button onClick={() => handleDelete(n.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        )} />
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إعلان جديد">
        <form action={handleSubmit} className="space-y-4">
          <Input label="العنوان" name="title" required />
          <textarea name="message" required placeholder="نص الإعلان" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={4} />
          <Select label="الجمهور" name="audience" options={[
            { value: "ALL", label: "الجميع" },
            { value: "ADMIN", label: "المسؤولون" },
            { value: "TEACHER", label: "المعلمون" },
            { value: "STUDENT", label: "الطلاب" },
            { value: "PARENT", label: "أولياء الأمور" },
          ]} />
          <Select label="الأولوية" name="priority" options={[
            { value: "LOW", label: "منخفضة" },
            { value: "NORMAL", label: "عادية" },
            { value: "HIGH", label: "عالية" },
            { value: "URGENT", label: "عاجلة" },
          ]} />
          <Input label="تاريخ الانتهاء" name="expiresAt" type="date" />
          <div className="flex justify-end"><Button type="submit">نشر</Button></div>
        </form>
      </Modal>
    </div>
  );
}
