"use client";

import { useState } from "react";
import { login } from "@/lib/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { School } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError("");
    const result = await login(formData);
    if (result && "error" in result) {
      setError(result.error as string);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <School className="h-8 w-8 text-blue-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">نظام إدارة المدرسة</h1>
          <p className="mt-2 text-sm text-gray-500">سجل دخولك للمتابعة</p>
        </div>

        <form action={handleSubmit} className="space-y-5">
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            placeholder="admin@school.com"
            required
          />
          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="remember" className="rounded border-gray-300" />
              تذكرني
            </label>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              نسيت كلمة المرور؟
            </a>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            تسجيل الدخول
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} نظام إدارة المدرسة
        </p>
      </div>
    </div>
  );
}
