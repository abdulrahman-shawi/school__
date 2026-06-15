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
import { Plus, Trash2, Paperclip } from "lucide-react";

export default function HomeworkPage() {
  const [homework, setHomework] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (session) setUserId(session.userId);
      const [h, c, s] = await Promise.all([getHomework(), getClasses(), getSubjects()]);
      setHomework(h); setClasses(c); setSubjects(s); setLoading(false);
    }
    init();
  }, []);

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "فشل رفع الملف");
    return json.url as string;
  }

  async function handleSubmit(formData: FormData) {
    setIsUploading(true);
    try {
      let attachmentUrl: string | undefined;
      if (selectedFile) {
        attachmentUrl = await uploadFile(selectedFile);
      }

      const data = Object.fromEntries(formData.entries());
      await createHomework({
        classId: data.classId as string,
        subjectId: data.subjectId as string,
        title: data.title as string,
        description: data.description as string,
        maxMarks: Number(data.maxMarks) || undefined,
        attachmentUrl,
        dueDate: data.dueDate as string,
        createdBy: userId,
      });
      setIsModalOpen(false);
      setSelectedFile(null);
      const h = await getHomework();
      setHomework(h);
    } finally {
      setIsUploading(false);
    }
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
    {
      key: "attachment",
      header: "المرفق",
      render: (h: any) =>
        h.attachmentUrl ? (
          <a
            href={h.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            <Paperclip className="ml-1 h-4 w-4" />
            عرض الملف
          </a>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الواجبات المنزلية</h1>
        <Button onClick={() => { setSelectedFile(null); setIsModalOpen(true); }}><Plus className="ml-2 h-4 w-4" /> واجب جديد</Button>
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
          <div className="w-full">
            <label className="mb-1 block text-sm font-medium text-gray-700">إرفاق ملف (اختياري)</label>
            <input
              key={isModalOpen ? "open" : "closed"}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="mt-1 text-xs text-gray-600">{selectedFile.name}</p>
            )}
          </div>
          <div className="flex justify-end"><Button type="submit" isLoading={isUploading} disabled={isUploading}>إضافة</Button></div>
        </form>
      </Modal>
    </div>
  );
}
