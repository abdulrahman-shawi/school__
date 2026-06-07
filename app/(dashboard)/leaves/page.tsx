"use client";

import { useState, useEffect } from "react";
import { getLeaves, createLeave, updateLeaveStatus } from "@/lib/actions/leaves";
import { getSession } from "@/lib/auth";
import { getUsers } from "@/lib/actions/users";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (session) setSessionUserId(session.userId);
      const [l, u] = await Promise.all([getLeaves(), getUsers()]);
      setLeaves(l); setUsers(u); setLoading(false);
    }
    init();
  }, []);

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    await createLeave({
      userId: data.userId as string,
      startDate: data.startDate as string,
      endDate: data.endDate as string,
      reason: data.reason as string,
    });
    setIsModalOpen(false);
    const l = await getLeaves();
    setLeaves(l);
  }

  async function handleStatus(id: string, status: string) {
    await updateLeaveStatus(id, status, sessionUserId);
    const l = await getLeaves();
    setLeaves(l);
  }

  const columns = [
    { key: "user", header: "الموظف", render: (l: any) => l.user.name },
    { key: "startDate", header: "من", render: (l: any) => formatDate(l.startDate) },
    { key: "endDate", header: "إلى", render: (l: any) => formatDate(l.endDate) },
    { key: "reason", header: "السبب" },
    { key: "status", header: "الحالة", render: (l: any) => <Badge variant={l.status === "APPROVED" ? "success" : l.status === "REJECTED" ? "danger" : "warning"}>{l.status === "APPROVED" ? "معتمد" : l.status === "REJECTED" ? "مرفوض" : "معلق"}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الإجازات</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="ml-2 h-4 w-4" /> طلب إجازة</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <DataTable columns={columns} data={leaves} keyExtractor={(l) => l.id} actions={(l) => (
          l.status === "PENDING" ? (
            <div className="flex gap-2">
              <button onClick={() => handleStatus(l.id, "APPROVED")} className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">موافقة</button>
              <button onClick={() => handleStatus(l.id, "REJECTED")} className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">رفض</button>
            </div>
          ) : null
        )} />
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="طلب إجازة">
        <form action={handleSubmit} className="space-y-4">
          <Select label="الموظف" name="userId" options={users.map((u) => ({ value: u.id, label: u.name }))} required />
          <Input label="من" name="startDate" type="date" required />
          <Input label="إلى" name="endDate" type="date" required />
          <textarea name="reason" required placeholder="سبب الإجازة" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} />
          <div className="flex justify-end"><Button type="submit">إرسال</Button></div>
        </form>
      </Modal>
    </div>
  );
}
