"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface UserFormProps {
  initialData?: any;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
  extraFields?: React.ReactNode;
  hidePassword?: boolean;
}

export function UserForm({
  initialData,
  role,
  onSubmit,
  isLoading,
  extraFields,
  hidePassword,
}: UserFormProps) {
  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="role" value={role} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="الاسم الكامل"
          name="name"
          defaultValue={initialData?.user?.name || initialData?.name || ""}
          required
        />
        <Input
          label="البريد الإلكتروني"
          name="email"
          type="email"
          defaultValue={initialData?.user?.email || initialData?.email || ""}
          required
        />
        {!hidePassword && (
          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            required={!initialData}
            placeholder={initialData ? "اتركها فارغة للإبقاء على الحالية" : ""}
          />
        )}
        <Input
          label="رقم الهاتف"
          name="phone"
          defaultValue={initialData?.user?.phone || initialData?.phone || ""}
        />
        <Input
          label="العنوان"
          name="address"
          defaultValue={initialData?.user?.address || initialData?.address || ""}
        />
        {initialData && (
          <Select
            label="الحالة"
            name="isActive"
            options={[
              { value: "true", label: "نشط" },
              { value: "false", label: "معطل" },
            ]}
            defaultValue={String(initialData?.user?.isActive ?? true)}
          />
        )}
      </div>
      {extraFields}
      <div className="flex justify-end pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "حفظ التعديلات" : "إضافة"}
        </Button>
      </div>
    </form>
  );
}
