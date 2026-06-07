"use client";

import { useState, useEffect } from "react";
import { getPayrolls, createPayroll, markPayrollPaid } from "@/lib/actions/payroll";
import { getTeachers } from "@/lib/actions/teachers";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Wallet } from "lucide-react";

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [p, t] = await Promise.all([getPayrolls(), getTeachers()]);
    setPayrolls(p); setTeachers(t); setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    await createPayroll({
      teacherId: data.teacherId as string,
      month: data.month as string,
      basicSalary: Number(data.basicSalary),
      deductions: Number(data.deductions) || 0,
      bonuses: Number(data.bonuses) || 0,
    });
    setIsModalOpen(false); loadData();
  }

  async function handlePaid(id: string) {
    await markPayrollPaid(id); loadData();
  }

  const columns = [
    { key: "teacher", header: "المعلم", render: (p: any) => p.teacher.user.name },
    { key: "month", header: "الشهر", render: (p: any) => new Date(p.month).toLocaleDateString("ar-SA", { year: "numeric", month: "long" }) },
    { key: "basicSalary", header: "الراتب الأساسي", render: (p: any) => formatCurrency(p.basicSalary) },
    { key: "deductions", header: "الخصومات", render: (p: any) => formatCurrency(p.deductions) },
    { key: "bonuses", header: "العلاوات", render: (p: any) => formatCurrency(p.bonuses) },
    { key: "netSalary", header: "الصافي", render: (p: any) => formatCurrency(p.netSalary) },
    { key: "status", header: "الحالة", render: (p: any) => <Badge variant={p.status === "PAID" ? "success" : "warning"}>{p.status === "PAID" ? "مدفوع" : "معلق"}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">كشوف الرواتب</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="ml-2 h-4 w-4" /> راتب جديد</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <DataTable columns={columns} data={payrolls} keyExtractor={(p) => p.id} actions={(p) => (
          p.status === "PENDING" ? <button onClick={() => handlePaid(p.id)} className="rounded p-1 text-green-600 hover:bg-green-50"><Wallet className="h-4 w-4" /></button> : null
        )} />
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="راتب جديد">
        <form action={handleSubmit} className="space-y-4">
          <Select label="المعلم" name="teacherId" options={teachers.map((t) => ({ value: t.id, label: t.user.name }))} required />
          <Input label="الشهر" name="month" type="month" required />
          <Input label="الراتب الأساسي" name="basicSalary" type="number" required />
          <Input label="الخصومات" name="deductions" type="number" defaultValue="0" />
          <Input label="العلاوات" name="bonuses" type="number" defaultValue="0" />
          <div className="flex justify-end"><Button type="submit">إضافة</Button></div>
        </form>
      </Modal>
    </div>
  );
}
