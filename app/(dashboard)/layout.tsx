import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SandboxBanner } from "@/components/layout/sandbox-banner";
import { getCurrentOrganization } from "@/lib/current-organization";

// Le layout lit l'organisation courante (DB) pour adapter le bandeau : tout le
// segment dashboard est donc rendu par requête (pas de prérendu au build).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const org = await getCurrentOrganization();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <SandboxBanner emailSendingEnabled={org.emailSendingEnabled} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
