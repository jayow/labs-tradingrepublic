import { requireAdmin } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader profile={profile} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
