"use client";

import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/actions/users";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const data = await getUsers("ADMIN");
    setUsers(data); setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const payload: any = {
      name: data.name, email: data.email, password: data.password,
      role: "ADMIN", phone: data.phone, address: data.address,
      isActive: data.isActive === "true",
    };
    if (editing) {
      if (!payload.password) delete payload.password;
      await updateUser(editing.id, payload);
    } else {
      await createUser(payload);
    }
    setIsModalOpen(false); setEditing(null); loadUsers();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteUser(id); loadUsers();
  }

  const columns = [
    { key: "name", header: "الاسم", render: (u: any) => u.name },
    { key: "email", header: "البريد" },
    { key: "phone", header: "الهاتف", render: (u: any) => u.phone || "-" },
    { key: "isActive", header: "الحالة", render: (u: any) => <Badge variant={u.isActive ? "success" : "danger"}>{u.isActive ? "نشط" : "معطل"}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المسؤولون</h1>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}><Plus className="ml-2 h-4 w-4" /> مسؤول جديد</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <DataTable columns={columns} data={users} keyExtractor={(u) => u.id} actions={(u) => (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(u); setIsModalOpen(true); }} className="rounded p-1 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(u.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        )} />
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "تعديل" : "جديد"}>
        <form action={handleSubmit} className="space-y-4">
          <Input label="الاسم" name="name" defaultValue={editing?.name} required />
          <Input label="البريد" name="email" type="email" defaultValue={editing?.email} required />
          <Input label="كلمة المرور" name="password" type="password" required={!editing} placeholder={editing ? "اتركها فارغة" : ""} />
          <Input label="الهاتف" name="phone" defaultValue={editing?.phone} />
          <Input label="العنوان" name="address" defaultValue={editing?.address} />
          {editing && <Select label="الحالة" name="isActive" options={[{ value: "true", label: "نشط" }, { value: "false", label: "معطل" }]} defaultValue={String(editing?.isActive ?? true)} />}
          <div className="flex justify-end"><Button type="submit">{editing ? "حفظ" : "إضافة"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
