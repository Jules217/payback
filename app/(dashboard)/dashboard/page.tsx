import type { Metadata } from "next";
import { Users, FileText, Bell, Wallet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { formatCurrency } from "@/lib/utils";
import { isOverdue } from "@/lib/invoices/status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const org = await getCurrentOrganization();

  const [invoices, activeClients] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId: org.id },
      select: { amountCents: true, currency: true, status: true, dueAt: true, paidAt: true },
    }),
    prisma.client.count({
      where: { organizationId: org.id, status: "ACTIVE" },
    }),
  ]);

  // Devise dominante pour l'affichage des montants agrégés.
  const currency = invoices[0]?.currency ?? "CAD";

  // Impayé = ni payée ni annulée.
  const unpaid = invoices.filter(
    (i) => i.status !== "PAID" && i.status !== "CANCELLED"
  );
  const unpaidCents = unpaid.reduce((sum, i) => sum + i.amountCents, 0);
  const overdueCount = invoices.filter(isOverdue).length;
  const paidCents = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amountCents, 0);

  const stats = [
    {
      label: "Montant à recouvrer",
      value: formatCurrency(unpaidCents, currency),
      icon: Wallet,
    },
    {
      label: "Factures en retard",
      value: String(overdueCount),
      icon: FileText,
    },
    {
      label: "Montant payé",
      value: formatCurrency(paidCents, currency),
      icon: Bell,
    },
    {
      label: "Clients actifs",
      value: String(activeClients),
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bienvenue sur Payback</CardTitle>
          <CardDescription>
            Suivez vos factures impayées, les retards et les paiements reçus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les relances automatiques (email/SMS) et leur planification seront
            disponibles dans une prochaine étape.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
