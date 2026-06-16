import { requireRole } from "@/lib/auth";

export default async function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN", "TEACHER");
  return <>{children}</>;
}
