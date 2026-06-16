import { requireRole } from "@/lib/auth";

export default async function TimetableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return <>{children}</>;
}
