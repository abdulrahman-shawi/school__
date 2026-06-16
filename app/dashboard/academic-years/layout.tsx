import { requireRole } from "@/lib/auth";

export default async function AcademicYearsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return <>{children}</>;
}
