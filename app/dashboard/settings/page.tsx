"use client";

import { useState, useEffect } from "react";
import { getSettings, upsertSetting } from "@/lib/actions/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const DEFAULT_SETTINGS = [
  { key: "SCHOOL_NAME", label: "اسم المدرسة" },
  { key: "SCHOOL_PHONE", label: "هاتف المدرسة" },
  { key: "SCHOOL_EMAIL", label: "بريد المدرسة" },
  { key: "SCHOOL_ADDRESS", label: "عنوان المدرسة" },
  { key: "CURRENCY", label: "العملة" },
  { key: "LOGO_URL", label: "رابط الشعار" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getSettings();
      const map: Record<string, string> = {};
      data.forEach((s) => { map[s.key] = s.value; });
      setSettings(map); setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    for (const [key, value] of Object.entries(data)) {
      await upsertSetting(key, value as string);
    }
    alert("تم حفظ الإعدادات");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">إعدادات النظام</h1>
      <Card>
        <CardHeader><CardTitle>إعدادات المدرسة</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>جاري التحميل...</p> : (
            <form action={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              {DEFAULT_SETTINGS.map((s) => (
                <Input key={s.key} label={s.label} name={s.key} defaultValue={settings[s.key] || ""} />
              ))}
              <div className="sm:col-span-2 flex justify-end"><Button type="submit">حفظ الإعدادات</Button></div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
