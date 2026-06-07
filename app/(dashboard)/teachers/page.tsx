"use client";

import { useState, useEffect } from "react";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "@/lib/actions/teachers";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    setLoading(true);
    const data = await getTeachers();
    setTeachers(data);
    setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const payload: any = {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      address: data.address,
      qualification: data.qualification,
      specialization: data.specialization,
      experience: Number(data.experience) || undefined,
      salary: Number(data.salary) || undefined,
      isActive: data.isActive === "true",
    };

    if (editing) {
      if (!payload.password) delete payload.password;
      await updateTeacher(editing.id, payload);
    } else {
      await createTeacher(payload);
    }

    setIsModalOpen(false);
    setEditing(null);
    loadTeachers();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteTeacher(id);
    loadTeachers();
  }

  const columns = [
    { key: "name", header: "الاسم", render: (t: any) => t.user.name },
    { key: "specialization", header: "التخصص", render: (t: any) => t.specialization || "-" },
    { key: "qualification", header: "المؤهل", render: (t: any) => t.qualification || "-" },
    { key: "experience", header: "الخبرة", render: (t: any) => t.experience ? `${t.experience} سنوات` : "-" },
    {
      key: "isActive",
      header: "الحالة",
      render: (t: any) => <Badge variant={t.user.isActive ? "success" : "danger"}>{t.user.isActive ? "نشط" : "معطل"}</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة المعلمين</h1>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          معلم جديد
        </Button>
      </div>

      {loading ? <p>جاري التحميل...</p> : (
        <DataTable
          columns={columns}
          data={teachers}
          keyExtractor={(t) => t.id}
          actions={(t) => (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(t); setIsModalOpen(true); }} className="rounded p-1 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(t.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          )}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "تعديل معلم" : "معلم جديد"} size="lg">
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="الاسم" name="name" defaultValue={editing?.user?.name} required />
            <Input label="البريد" name="email" type="email" defaultValue={editing?.user?.email} required />
            <Input label="كلمة المرور" name="password" type="password" required={!editing} placeholder={editing ? "اتركها فارغة" : ""} />
            <Input label="التخصص" name="specialization" defaultValue={editing?.specialization} />
            <Input label="المؤهل" name="qualification" defaultValue={editing?.qualification} />
            <Input label="سنوات الخبرة" name="experience" type="number" defaultValue={editing?.experience} />
            <Input label="الراتب الأساسي" name="salary" type="number" defaultValue={editing?.salary} />
            <Input label="الهاتف" name="phone" defaultValue={editing?.user?.phone} />
            <Input label="العنوان" name="address" defaultValue={editing?.user?.address} />
            {editing && (
              <Select label="الحالة" name="isActive" options={[{ value: "true", label: "نشط" }, { value: "false", label: "معطل" }]} defaultValue={String(editing?.user?.isActive ?? true)} />
            )}
          </div>
          <div className="flex justify-end pt-4"><Button type="submit">{editing ? "حفظ" : "إضافة"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
