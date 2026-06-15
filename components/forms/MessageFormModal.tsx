"use client";

import { useState, useEffect } from "react";
import { formatClassName } from "@/lib/utils";
import { createMessage } from "@/lib/actions/messages";
import { getUsers } from "@/lib/actions/users";
import { getClasses } from "@/lib/actions/classes";
import { getSubjects } from "@/lib/actions/subjects";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

interface MessageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderId: string;
  defaultReceiverId?: string;
  defaultClassId?: string;
  onSent?: () => void;
}

export function MessageFormModal({
  isOpen,
  onClose,
  senderId,
  defaultReceiverId,
  defaultClassId,
  onSent,
}: MessageFormModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setFormKey((k) => k + 1);
    setLoading(true);
    Promise.all([getUsers(), getClasses(), getSubjects()])
      .then(([u, c, s]) => {
        setUsers(u);
        setClasses(c);
        setSubjects(s);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      const data = Object.fromEntries(formData.entries());
      await createMessage({
        senderId,
        receiverId: (data.receiverId as string) || undefined,
        classId: data.classId as string,
        subjectId: (data.subjectId as string) || undefined,
        content: data.content as string,
      });
      onSent?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="رسالة جديدة">
      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <form key={formKey} action={handleSubmit} className="space-y-4">
          <Select
            label="المستلم (اختياري)"
            name="receiverId"
            options={users.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))}
            defaultValue={defaultReceiverId}
          />
          <Select
            label="الصف"
            name="classId"
            options={classes.map((c) => ({ value: c.id, label: formatClassName(c) }))}
            defaultValue={defaultClassId}
            required
          />
          <Select label="المادة (اختياري)" name="subjectId" options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
          <textarea
            name="content"
            required
            placeholder="نص الرسالة"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={4}
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>إرسال</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
