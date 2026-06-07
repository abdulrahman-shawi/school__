"use client";

import { useState, useEffect } from "react";
import { getEvents, createEvent, deleteEvent } from "@/lib/actions/events";
import { getSession } from "@/lib/auth";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (session) setUserId(session.userId);
      loadEvents();
    }
    init();
  }, []);

  async function loadEvents() {
    setLoading(true);
    const data = await getEvents();
    setEvents(data); setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    await createEvent({
      title: data.title as string,
      description: data.description as string,
      startDate: data.startDate as string,
      endDate: data.endDate as string,
      audience: data.audience as string,
      createdBy: userId,
    });
    setIsModalOpen(false); loadEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteEvent(id); loadEvents();
  }

  const columns = [
    { key: "title", header: "الفعالية" },
    { key: "startDate", header: "تاريخ البداية", render: (e: any) => formatDate(e.startDate) },
    { key: "endDate", header: "تاريخ النهاية", render: (e: any) => formatDate(e.endDate) },
    { key: "audience", header: "الجمهور" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الفعاليات والتقويم</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="ml-2 h-4 w-4" /> فعالية جديدة</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : <DataTable columns={columns} data={events} keyExtractor={(e) => e.id} actions={(e) => <button onClick={() => handleDelete(e.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>} />}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="فعالية جديدة">
        <form action={handleSubmit} className="space-y-4">
          <Input label="العنوان" name="title" required />
          <textarea name="description" placeholder="الوصف" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} />
          <Input label="تاريخ البداية" name="startDate" type="datetime-local" required />
          <Input label="تاريخ النهاية" name="endDate" type="datetime-local" />
          <Select label="الجمهور" name="audience" options={[
            { value: "ALL", label: "الجميع" },
            { value: "STUDENTS", label: "الطلاب" },
            { value: "TEACHERS", label: "المعلمون" },
            { value: "PARENTS", label: "أولياء الأمور" },
          ]} />
          <div className="flex justify-end"><Button type="submit">إضافة</Button></div>
        </form>
      </Modal>
    </div>
  );
}
