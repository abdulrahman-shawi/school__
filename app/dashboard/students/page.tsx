"use client";

import { useState, useEffect } from "react";
import { getStudents, createStudent, updateStudent, deleteStudent } from "@/lib/actions/students";
import { getClasses } from "@/lib/actions/classes";
import { getParents } from "@/lib/actions/parents";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { GENDER_MAP, formatClassName, formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [s, c, p] = await Promise.all([getStudents(), getClasses(), getParents()]);
    setStudents(s);
    setClasses(c);
    setParents(p);
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
      admissionNo: data.admissionNo,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      previousSchool: data.previousSchool,
      classId: data.classId,
      parentId: data.parentId,
      isActive: data.isActive === "true",
      monthlyFee: data.monthlyFee ? Number(data.monthlyFee) : undefined,
      feeExtensionUntil: data.feeExtensionUntil ? (data.feeExtensionUntil as string) : undefined,
    };

    if (editing) {
      if (!payload.password) delete payload.password;
      await updateStudent(editing.id, payload);
    } else {
      await createStudent(payload);
    }

    setIsModalOpen(false);
    setEditing(null);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;
    await deleteStudent(id);
    loadData();
  }

  const columns = [
    { key: "name", header: "الاسم", render: (s: any) => s.user.name },
    { key: "admissionNo", header: "رقم القيد", render: (s: any) => s.admissionNo },
    { key: "class", header: "الصف", render: (s: any) => (s.class ? formatClassName(s.class) : "-") },
    { key: "parent", header: "ولي الأمر", render: (s: any) => s.parent?.user.name || "-" },
    {
      key: "gender",
      header: "الجنس",
      render: (s: any) => (s.gender ? GENDER_MAP[s.gender] : "-"),
    },
    {
      key: "isActive",
      header: "الحالة",
      render: (s: any) => (
        <Badge variant={s.user.isActive ? "success" : "danger"}>
          {s.user.isActive ? "نشط" : "معطل"}
        </Badge>
      ),
    },
    {
      key: "monthlyFee",
      header: "الرسوم الشهرية",
      render: (s: any) => (s.monthlyFee ? formatCurrency(s.monthlyFee) : "-"),
    },
    {
      key: "feeExtensionUntil",
      header: "التمديد حتى",
      render: (s: any) => (s.feeExtensionUntil ? formatDate(s.feeExtensionUntil) : "-"),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة الطلاب</h1>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          طالب جديد
        </Button>
      </div>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <DataTable
          columns={columns}
          data={students}
          keyExtractor={(s) => s.id}
          actions={(s) => (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(s); setIsModalOpen(true); }}
                className="rounded p-1 text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(s.id)}
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
        title={editing ? "تعديل طالب" : "طالب جديد"}
        size="lg"
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="الاسم" name="name" defaultValue={editing?.user?.name} required />
            <Input label="البريد" name="email" type="email" defaultValue={editing?.user?.email} required />
            <Input label="كلمة المرور" name="password" type="password" required={!editing} placeholder={editing ? "اتركها فارغة" : ""} />
            <Input label="رقم القيد" name="admissionNo" defaultValue={editing?.admissionNo} required />
            <Input label="تاريخ الميلاد" name="dateOfBirth" type="date" defaultValue={editing?.dateOfBirth ? new Date(editing.dateOfBirth).toISOString().split("T")[0] : ""} />
            <Select label="الجنس" name="gender" options={[{ value: "MALE", label: "ذكر" }, { value: "FEMALE", label: "أنثى" }]} defaultValue={editing?.gender} />
            <Input label="فصيلة الدم" name="bloodGroup" defaultValue={editing?.bloodGroup} />
            <Input label="المدرسة السابقة" name="previousSchool" defaultValue={editing?.previousSchool} />
            <Select label="الصف" name="classId" options={classes.map((c) => ({ value: c.id, label: formatClassName(c) }))} defaultValue={editing?.classId} />
            <Select label="ولي الأمر" name="parentId" options={parents.map((p) => ({ value: p.id, label: p.user.name }))} defaultValue={editing?.parentId} />
            <Input label="الهاتف" name="phone" defaultValue={editing?.user?.phone} />
            <Input label="العنوان" name="address" defaultValue={editing?.user?.address} />
            <Input label="الرسوم الشهرية" name="monthlyFee" type="number" defaultValue={editing?.monthlyFee ?? ""} />
            <Input label="تمديد الرسوم حتى" name="feeExtensionUntil" type="date" defaultValue={editing?.feeExtensionUntil ? new Date(editing.feeExtensionUntil).toISOString().split("T")[0] : ""} />
            {editing && (
              <Select label="الحالة" name="isActive" options={[{ value: "true", label: "نشط" }, { value: "false", label: "معطل" }]} defaultValue={String(editing?.user?.isActive ?? true)} />
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">{editing ? "حفظ" : "إضافة"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
