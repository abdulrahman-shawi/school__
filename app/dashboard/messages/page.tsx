"use client";

import { useState, useEffect } from "react";
import { formatClassName } from "@/lib/utils";
import { getMessages } from "@/lib/actions/messages";
import { getSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MessageFormModal } from "@/components/forms/MessageFormModal";
import { Plus } from "lucide-react";

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (!session) return;
      setUserId(session.userId);
      const m = await getMessages(session.userId);
      setMessages(m);
      setLoading(false);
    }
    init();
  }, []);

  async function reloadMessages() {
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
                    <p className="font-semibold">
                      {m.senderId === userId
                        ? m.receiver
                          ? `إلى: ${m.receiver.name}`
                          : `إلى صف: ${formatClassName(m.class)}`
                        : `من: ${m.sender.name}`}
                    </p>
                    <p className="text-sm text-gray-600">{m.content}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString("ar-SA")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <MessageFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        senderId={userId}
        onSent={reloadMessages}
      />
    </div>
  );
}
