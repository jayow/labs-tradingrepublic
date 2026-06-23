import { requireUser } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader profile={profile} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
