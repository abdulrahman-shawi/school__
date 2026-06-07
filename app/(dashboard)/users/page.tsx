"use client";

import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/actions/users";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { UserForm } from "@/components/forms/UserForm";
import { Select } from "@/components/ui/Select";
import { ROLES_MAP } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  async function loadUsers() {
    setLoading(true);
    const data = await getUsers(roleFilter || undefined);
    setUsers(data);
    setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const payload = {
      name: data.name as string,
      email: data.email as string,
      password: data.password as string,
      role: data.role as string,
      phone: data.phone as string,
      address: data.address as string,
      isActive: data.isActive === "true",
    };

    if (editing) {
      const updatePayload: any = { ...payload };
      if (!updatePayload.password) delete updatePayload.password;
      await updateUser(editing.id, updatePayload);
    } else {
      await createUser(payload as any);
    }

    setIsModalOpen(false);
    setEditing(null);
    loadUsers();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    await deleteUser(id);
    loadUsers();
  }

  const columns = [
    { key: "name", header: "الاسم", render: (u: any) => u.name },
    { key: "email", header: "البريد" },
    {
      key: "role",
      header: "الدور",
      render: (u: any) => <Badge variant="info">{ROLES_MAP[u.role] || u.role}</Badge>,
    },
    {
      key: "isActive",
      header: "الحالة",
      render: (u: any) => (
        <Badge variant={u.isActive ? "success" : "danger"}>
          {u.isActive ? "نشط" : "معطل"}
        </Badge>
      ),
    },
    { key: "phone", header: "الهاتف", render: (u: any) => u.phone || "-" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          مستخدم جديد
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">كل الأدوار</option>
          <option value="ADMIN">مسؤول</option>
          <option value="TEACHER">معلم</option>
          <option value="STUDENT">طالب</option>
          <option value="PARENT">ولي أمر</option>
        </select>
      </div>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          actions={(u) => (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(u); setIsModalOpen(true); }}
                className="rounded p-1 text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(u.id)}
                className="rounded p-1 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? "تعديل مستخدم" : "مستخدم جديد"}
        footer={null}
      >
        <UserForm
          role={editing?.role || "ADMIN"}
          initialData={editing}
          onSubmit={handleSubmit}
          hidePassword={false}
          extraFields={
            <Select
              label="الدور"
              name="role"
              options={[
                { value: "ADMIN", label: "مسؤول" },
                { value: "TEACHER", label: "معلم" },
                { value: "STUDENT", label: "طالب" },
                { value: "PARENT", label: "ولي أمر" },
              ]}
              defaultValue={editing?.role || "ADMIN"}
            />
          }
        />
      </Modal>
    </div>
  );
}
