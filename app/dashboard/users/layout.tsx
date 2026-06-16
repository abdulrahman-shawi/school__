import { requireRole } from "@/lib/auth";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return <>{children}</>;
}
