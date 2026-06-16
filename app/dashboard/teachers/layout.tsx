import { requireRole } from "@/lib/auth";

export default async function TeachersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return <>{children}</>;
}
