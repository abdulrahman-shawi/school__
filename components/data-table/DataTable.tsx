"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  actions?: (row: T) => ReactNode;
}

export function DataTable<T>({ columns, data, keyExtractor, actions }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-right font-semibold">
                {col.header}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right font-semibold">إجراءات</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-4 py-8 text-center text-gray-500"
              >
                لا توجد بيانات
              </td>
            </tr>
          )}
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-900">
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
              {actions && <td className="px-4 py-3">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
