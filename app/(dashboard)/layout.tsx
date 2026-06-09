import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SandboxBanner } from "@/components/layout/sandbox-banner";
import { getCurrentOrganization } from "@/lib/current-organization";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const org = await getCurrentOrganization();

  const queueCount = await prisma.reminderEvent.count({
    where: {
      organizationId: org.id,
      status: "SCHEDULED",
      deliveryMode: "CLIENT",
    },
  });

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar queueCount={queueCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader queueCount={queueCount} />
        <SandboxBanner emailSendingEnabled={org.emailSendingEnabled} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
