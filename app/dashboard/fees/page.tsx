"use client";

import { useState, useEffect } from "react";
import {
  getFeeTypes,
  createFeeType,
  deleteFeeType,
  getFeeCollections,
  createFeeCollection,
  recordPayment,
  deleteFeeCollection,
} from "@/lib/actions/fees";
import { getStudents } from "@/lib/actions/students";
import { getClasses } from "@/lib/actions/classes";
import { getAcademicYears } from "@/lib/actions/academicYears";
import {
  getStudentsMonthlyFeeStatus,
  recordMonthlyFeePayment,
  updateStudentFeeExtension,
} from "@/lib/fees";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatClassName, formatDate } from "@/lib/utils";
import { Plus, Trash2, Wallet, CalendarClock } from "lucide-react";

export default function FeesPage() {
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [monthlyStatus, setMonthlyStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"types" | "collections" | "monthly">("types");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"type" | "collection" | "payment" | "monthlyPayment" | "monthlyExtension">("type");
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [selectedStudentStatus, setSelectedStudentStatus] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [ft, fc, st, cl, y] = await Promise.all([
      getFeeTypes(), getFeeCollections(), getStudents(), getClasses(), getAcademicYears(),
    ]);
    const monthly = await getStudentsMonthlyFeeStatus(st.map((s: any) => s.id));
    setFeeTypes(ft); setCollections(fc); setStudents(st); setClasses(cl); setYears(y); setMonthlyStatus(monthly); setLoading(false);
  }

  async function handleTypeSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    await createFeeType({ name: data.name as string, amount: Number(data.amount), frequency: data.frequency as string });
    setIsModalOpen(false); loadData();
  }

  async function handleCollectionSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    await createFeeCollection({
      studentId: data.studentId as string,
      classId: data.classId as string,
      feeTypeId: data.feeTypeId as string,
      academicYearId: data.academicYearId as string,
      amount: Number(data.amount),
      dueDate: data.dueDate as string,
    });
    setIsModalOpen(false); loadData();
  }

  async function handlePayment(formData: FormData) {
    const amount = Number(formData.get("amount"));
    await recordPayment(selectedCollection.id, amount);
    setIsModalOpen(false); setSelectedCollection(null); loadData();
  }

  async function handleMonthlyPayment(formData: FormData) {
    const amount = Number(formData.get("amount"));
    const result = await recordMonthlyFeePayment(selectedStudentStatus.studentId, amount);
    if (result && "error" in result) {
      alert(result.error);
      return;
    }
    setIsModalOpen(false); setSelectedStudentStatus(null); loadData();
  }

  async function handleMonthlyExtension(formData: FormData) {
    const extensionUntil = formData.get("extensionUntil") as string;
    const result = await updateStudentFeeExtension(selectedStudentStatus.studentId, extensionUntil || null);
    if (result && "error" in result) {
      alert(result.error);
      return;
    }
    setIsModalOpen(false); setSelectedStudentStatus(null); loadData();
  }

  async function handleDeleteType(id: string) { if (confirm("هل أنت متأكد؟")) { await deleteFeeType(id); loadData(); } }
  async function handleDeleteCollection(id: string) { if (confirm("هل أنت متأكد؟")) { await deleteFeeCollection(id); loadData(); } }

  const typeColumns = [
    { key: "name", header: "نوع الرسم" },
    { key: "amount", header: "المبلغ", render: (t: any) => formatCurrency(t.amount) },
    { key: "frequency", header: "التكرار", render: (t: any) => t.frequency || "-" },
  ];

  const collectionColumns = [
    { key: "student", header: "الطالب", render: (c: any) => c.student.user.name },
    { key: "feeType", header: "نوع الرسم", render: (c: any) => c.feeType.name },
    { key: "amount", header: "المطلوب", render: (c: any) => formatCurrency(c.amount) },
    { key: "paidAmount", header: "المدفوع", render: (c: any) => formatCurrency(c.paidAmount) },
    { key: "status", header: "الحالة", render: (c: any) => <Badge variant={c.status === "PAID" ? "success" : c.status === "PARTIAL" ? "warning" : "danger"}>{c.status === "PAID" ? "مدفوع" : c.status === "PARTIAL" ? "جزئي" : "غير مدفوع"}</Badge> },
  ];

  const monthlyColumns = [
    { key: "student", header: "الطالب", render: (s: any) => {
      const student = students.find((st) => st.id === s.studentId);
      return student?.user?.name || "-";
    }},
    { key: "class", header: "الصف", render: (s: any) => {
      const student = students.find((st) => st.id === s.studentId);
      return student?.class ? formatClassName(student.class) : "-";
    }},
    { key: "monthlyFee", header: "الرسوم الشهرية", render: (s: any) => formatCurrency(s.monthlyFee) },
    { key: "paidAmount", header: "المدفوع", render: (s: any) => formatCurrency(s.paidAmount) },
    { key: "dueAmount", header: "المتبقي", render: (s: any) => formatCurrency(s.dueAmount) },
    { key: "status", header: "الحالة", render: (s: any) => <Badge variant={s.status === "PAID" ? "success" : s.status === "PARTIAL" ? "warning" : "danger"}>{s.status === "PAID" ? "مدفوع" : s.status === "PARTIAL" ? "جزئي" : "غير مدفوع"}</Badge> },
    { key: "extensionUntil", header: "التمديد حتى", render: (s: any) => s.extensionUntil ? formatDate(s.extensionUntil) : "-" },
    { key: "access", header: "الدخول", render: (s: any) => <Badge variant={s.isAccessAllowed ? "success" : "danger"}>{s.isAccessAllowed ? "مسموح" : "محظور"}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الرسوم المالية</h1>
        <div className="flex gap-2">
          <Button variant={activeTab === "types" ? "primary" : "secondary"} onClick={() => setActiveTab("types")}>أنواع الرسوم</Button>
          <Button variant={activeTab === "collections" ? "primary" : "secondary"} onClick={() => setActiveTab("collections")}>التحصيل</Button>
          <Button variant={activeTab === "monthly" ? "primary" : "secondary"} onClick={() => setActiveTab("monthly")}>الرسوم الشهرية</Button>
        </div>
      </div>

      {activeTab === "types" && (
        <>
          <div className="flex justify-end"><Button onClick={() => { setModalType("type"); setIsModalOpen(true); }}><Plus className="ml-2 h-4 w-4" /> نوع جديد</Button></div>
          {loading ? <p>جاري التحميل...</p> : <DataTable columns={typeColumns} data={feeTypes} keyExtractor={(t) => t.id} actions={(t) => <button onClick={() => handleDeleteType(t.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>} />}
          <Modal isOpen={isModalOpen && modalType === "type"} onClose={() => setIsModalOpen(false)} title="نوع رسم جديد">
            <form action={handleTypeSubmit} className="space-y-4">
              <Input label="الاسم" name="name" required />
              <Input label="المبلغ" name="amount" type="number" required />
              <Input label="التكرار" name="frequency" placeholder="شهري، سنوي، لمرة واحدة" />
              <div className="flex justify-end"><Button type="submit">إضافة</Button></div>
            </form>
          </Modal>
        </>
      )}

      {activeTab === "collections" && (
        <>
          <div className="flex justify-end"><Button onClick={() => { setModalType("collection"); setIsModalOpen(true); }}><Plus className="ml-2 h-4 w-4" /> تحصيل جديد</Button></div>
          {loading ? <p>جاري التحميل...</p> : <DataTable columns={collectionColumns} data={collections} keyExtractor={(c) => c.id} actions={(c) => (
            <div className="flex gap-2">
              <button onClick={() => { setSelectedCollection(c); setModalType("payment"); setIsModalOpen(true); }} className="rounded p-1 text-green-600 hover:bg-green-50"><Wallet className="h-4 w-4" /></button>
              <button onClick={() => handleDeleteCollection(c.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          )} />}
          <Modal isOpen={isModalOpen && modalType === "collection"} onClose={() => setIsModalOpen(false)} title="تحصيل جديد">
            <form action={handleCollectionSubmit} className="space-y-4">
              <Select label="الطالب" name="studentId" options={students.map((s) => ({ value: s.id, label: s.user.name }))} required />
              <Select label="الصف" name="classId" options={classes.map((c) => ({ value: c.id, label: formatClassName(c) }))} required />
              <Select label="نوع الرسم" name="feeTypeId" options={feeTypes.map((t) => ({ value: t.id, label: t.name }))} required />
              <Select label="السنة" name="academicYearId" options={years.map((y) => ({ value: y.id, label: y.name }))} required />
              <Input label="المبلغ" name="amount" type="number" required />
              <Input label="تاريخ الاستحقاق" name="dueDate" type="date" required />
              <div className="flex justify-end"><Button type="submit">إضافة</Button></div>
            </form>
          </Modal>
          <Modal isOpen={isModalOpen && modalType === "payment"} onClose={() => setIsModalOpen(false)} title="تسجيل دفعة">
            <form action={handlePayment} className="space-y-4">
              <p className="text-sm text-gray-600">المبلغ المطلوب: {selectedCollection ? formatCurrency(selectedCollection.amount - selectedCollection.paidAmount) : "-"}</p>
              <Input label="المبلغ المدفوع" name="amount" type="number" required />
              <div className="flex justify-end"><Button type="submit">تسجيل</Button></div>
            </form>
          </Modal>
        </>
      )}

      {activeTab === "monthly" && (
        <>
          {loading ? <p>جاري التحميل...</p> : (
            <DataTable
              columns={monthlyColumns}
              data={monthlyStatus}
              keyExtractor={(s) => s.studentId}
              actions={(s) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedStudentStatus(s); setModalType("monthlyPayment"); setIsModalOpen(true); }}
                    className="rounded p-1 text-green-600 hover:bg-green-50"
                    title="تسجيل دفع رسوم شهرية"
                  >
                    <Wallet className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setSelectedStudentStatus(s); setModalType("monthlyExtension"); setIsModalOpen(true); }}
                    className="rounded p-1 text-blue-600 hover:bg-blue-50"
                    title="تمديد رسوم الطالب"
                  >
                    <CalendarClock className="h-4 w-4" />
                  </button>
                </div>
              )}
            />
          )}
          <Modal isOpen={isModalOpen && modalType === "monthlyPayment"} onClose={() => setIsModalOpen(false)} title="تسجيل دفع رسوم شهرية">
            <form action={handleMonthlyPayment} className="space-y-4">
              <p className="text-sm text-gray-600">
                الطالب: {selectedStudentStatus ? students.find((s) => s.id === selectedStudentStatus.studentId)?.user?.name : "-"}
              </p>
              <p className="text-sm text-gray-600">
                المتبقي: {selectedStudentStatus ? formatCurrency(selectedStudentStatus.dueAmount) : "-"}
              </p>
              <Input label="المبلغ المدفوع" name="amount" type="number" required />
              <div className="flex justify-end"><Button type="submit">تسجيل</Button></div>
            </form>
          </Modal>
          <Modal isOpen={isModalOpen && modalType === "monthlyExtension"} onClose={() => setIsModalOpen(false)} title="تمديد رسوم الطالب">
            <form action={handleMonthlyExtension} className="space-y-4">
              <p className="text-sm text-gray-600">
                الطالب: {selectedStudentStatus ? students.find((s) => s.id === selectedStudentStatus.studentId)?.user?.name : "-"}
              </p>
              <Input
                label="تاريخ نهاية التمديد"
                name="extensionUntil"
                type="date"
                defaultValue={selectedStudentStatus?.extensionUntil ? new Date(selectedStudentStatus.extensionUntil).toISOString().split("T")[0] : ""}
                required
              />
              <p className="text-xs text-gray-500">سيتمكن الطالب وولي أمره من تسجيل الدخول حتى هذا التاريخ حتى لو لم تُسدد الرسوم.</p>
              <div className="flex justify-end"><Button type="submit">حفظ</Button></div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}
