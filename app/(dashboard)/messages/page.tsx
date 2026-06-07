"use client";

import { useState, useEffect } from "react";
import { getMessages, createMessage } from "@/lib/actions/messages";
import { getSession } from "@/lib/auth";
import { getUsers } from "@/lib/actions/users";
import { getClasses } from "@/lib/actions/classes";
import { getSubjects } from "@/lib/actions/subjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus } from "lucide-react";

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (!session) return;
      setUserId(session.userId);
      const [m, u, c, s] = await Promise.all([
        getMessages(session.userId),
        getUsers(),
        getClasses(),
        getSubjects(),
      ]);
      setMessages(m); setUsers(u); setClasses(c); setSubjects(s); setLoading(false);
    }
    init();
  }, []);

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    await createMessage({
      senderId: userId,
      receiverId: data.receiverId as string,
      classId: data.classId as string,
      subjectId: data.subjectId as string || undefined,
      content: data.content as string,
    });
    setIsModalOpen(false);
    const m = await getMessages(userId);
    setMessages(m);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الرسائل</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="ml-2 h-4 w-4" /> رسالة جديدة</Button>
      </div>
      {loading ? <p>جاري التحميل...</p> : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className={m.readAt ? "opacity-70" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{m.senderId === userId ? `إلى: ${m.receiver.name}` : `من: ${m.sender.name}`}</p>
                    <p className="text-sm text-gray-600">{m.content}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString("ar-SA")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="رسالة جديدة">
        <form action={handleSubmit} className="space-y-4">
          <Select label="المستلم" name="receiverId" options={users.map((u) => ({ value: u.id, label: u.name }))} required />
          <Select label="الصف" name="classId" options={classes.map((c) => ({ value: c.id, label: c.name }))} required />
          <Select label="المادة (اختياري)" name="subjectId" options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
          <textarea name="content" required placeholder="نص الرسالة" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={4} />
          <div className="flex justify-end"><Button type="submit">إرسال</Button></div>
        </form>
      </Modal>
    </div>
  );
}
