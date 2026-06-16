import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Sidebar role={session.role} />
      <div className="mr-64 flex min-h-screen flex-col">
        <Header user={{ name: session.name, role: session.role }} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
