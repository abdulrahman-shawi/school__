"use client";

import { useState, useEffect } from "react";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassSubjectIds,
  setClassSubjects,
  getClassTeacherIds,
  setClassTeachers,
} from "@/lib/actions/classes";
import { getAcademicYears } from "@/lib/actions/academicYears";
import { getTeachers } from "@/lib/actions/teachers";
import { getSubjects } from "@/lib/actions/subjects";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatClassName } from "@/lib/utils";
import { Plus, Pencil, Trash2, BookOpen, Users } from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Main modal (create / edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // Link subjects modal
  const [linkSubjectsOpen, setLinkSubjectsOpen] = useState(false);
  const [linkSubjectsClass, setLinkSubjectsClass] = useState<any>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [linkSubjectsLoading, setLinkSubjectsLoading] = useState(false);

  // Link teachers modal
  const [linkTeachersOpen, setLinkTeachersOpen] = useState(false);
  const [linkTeachersClass, setLinkTeachersClass] = useState<any>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [linkTeachersLoading, setLinkTeachersLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [c, a, t, s] = await Promise.all([
      getClasses(),
      getAcademicYears(),
      getTeachers(),
      getSubjects(),
    ]);
    setClasses(c);
    setAcademicYears(a);
    setTeachers(t);
    setSubjects(s);
    setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const payload = {
      name: data.name as string,
      section: data.section as string,
      capacity: Number(data.capacity) || undefined,
      academicYearId: data.academicYearId as string,
      classTeacherId: (data.classTeacherId as string) || undefined,
    };
    if (editing) await updateClass(editing.id, payload);
    else await createClass(payload);
    setIsModalOpen(false);
    setEditing(null);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteClass(id);
    loadData();
  }

  // ─── Link Subjects ───
  async function openLinkSubjects(cls: any) {
    setLinkSubjectsClass(cls);
    setSelectedSubjectIds([]);
    setLinkSubjectsOpen(true);
    const ids = await getClassSubjectIds(cls.id);
    setSelectedSubjectIds(ids);
  }

  async function handleSaveClassSubjects() {
    if (!linkSubjectsClass) return;
    setLinkSubjectsLoading(true);
    await setClassSubjects(linkSubjectsClass.id, selectedSubjectIds);
    setLinkSubjectsLoading(false);
    setLinkSubjectsOpen(false);
    loadData();
  }

  function toggleSubjectId(id: string) {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // ─── Link Teachers ───
  async function openLinkTeachers(cls: any) {
    setLinkTeachersClass(cls);
    setSelectedTeacherIds([]);
    setLinkTeachersOpen(true);
    const ids = await getClassTeacherIds(cls.id);
    setSelectedTeacherIds(ids);
  }

  async function handleSaveClassTeachers() {
    if (!linkTeachersClass) return;
    setLinkTeachersLoading(true);
    await setClassTeachers(linkTeachersClass.id, selectedTeacherIds);
    setLinkTeachersLoading(false);
    setLinkTeachersOpen(false);
    loadData();
  }

  function toggleTeacherId(id: string) {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const columns = [
    { key: "name", header: "الصف", render: (c: any) => formatClassName(c) },
    {
      key: "academicYear",
      header: "السنة",
      render: (c: any) => c.academicYear.name,
    },
    {
      key: "classTeacher",
      header: "معلم الصف",
      render: (c: any) => c.classTeacher?.user.name || "-",
    },
    { key: "capacity", header: "السعة", render: (c: any) => c.capacity || "-" },
    {
      key: "students",
      header: "عدد الطلاب",
      render: (c: any) => c._count.students,
    },
    {
      key: "subjectsCount",
      header: "المواد",
      render: (c: any) => c._count.classSubjects,
    },
    {
      key: "teachersCount",
      header: "المعلمون",
      render: (c: any) => c._count.classTeachers,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الصفوف الدراسية</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="ml-2 h-4 w-4" /> صف جديد
        </Button>
      </div>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <DataTable
          columns={columns}
          data={classes}
          keyExtractor={(c) => c.id}
          actions={(c) => (
            <div className="flex gap-1">
              <button
                onClick={() => openLinkSubjects(c)}
                title="ربط مواد"
                className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
              >
                <BookOpen className="h-4 w-4" />
              </button>
              <button
                onClick={() => openLinkTeachers(c)}
                title="ربط معلمين"
                className="rounded p-1 text-indigo-600 hover:bg-indigo-50"
              >
                <Users className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setEditing(c);
                  setIsModalOpen(true);
                }}
                className="rounded p-1 text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="rounded p-1 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? "تعديل صف" : "صف جديد"}
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="اسم الصف"
              name="name"
              defaultValue={editing?.name}
              required
            />
            <Input
              label="الشعبة"
              name="section"
              defaultValue={editing?.section}
            />
            <Input
              label="السعة"
              name="capacity"
              type="number"
              defaultValue={editing?.capacity}
            />
            <Select
              label="السنة الدراسية"
              name="academicYearId"
              options={academicYears.map((y) => ({
                value: y.id,
                label: y.name,
              }))}
              defaultValue={editing?.academicYearId}
              required
            />
            <Select
              label="معلم الصف"
              name="classTeacherId"
              options={teachers.map((t) => ({
                value: t.id,
                label: t.user.name,
              }))}
              defaultValue={editing?.classTeacherId}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">{editing ? "حفظ" : "إضافة"}</Button>
          </div>
        </form>
      </Modal>

      {/* Link Subjects Modal */}
      <Modal
        isOpen={linkSubjectsOpen}
        onClose={() => setLinkSubjectsOpen(false)}
        title={`ربط مواد بـ ${linkSubjectsClass ? formatClassName(linkSubjectsClass) : ""}`}
        size="lg"
      >
        <div className="space-y-4">
          {subjects.length === 0 ? (
            <p className="text-center text-gray-500">لا توجد مواد متاحة</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {subjects.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedSubjectIds.includes(s.id)}
                    onChange={() => toggleSubjectId(s.id)}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {s.name}
                    </p>
                    {s.code && (
                      <p className="text-xs text-gray-500">{s.code}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setLinkSubjectsOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveClassSubjects}
              isLoading={linkSubjectsLoading}
            >
              حفظ
            </Button>
          </div>
        </div>
      </Modal>

      {/* Link Teachers Modal */}
      <Modal
        isOpen={linkTeachersOpen}
        onClose={() => setLinkTeachersOpen(false)}
        title={`ربط معلمين بـ ${linkTeachersClass ? formatClassName(linkTeachersClass) : ""}`}
        size="lg"
      >
        <div className="space-y-4">
          {teachers.length === 0 ? (
            <p className="text-center text-gray-500">
              لا يوجد معلمون متاحون
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teachers.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedTeacherIds.includes(t.id)}
                    onChange={() => toggleTeacherId(t.id)}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t.user.name}
                    </p>
                    {t.specialization && (
                      <p className="text-xs text-gray-500">
                        {t.specialization}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setLinkTeachersOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveClassTeachers}
              isLoading={linkTeachersLoading}
            >
              حفظ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
