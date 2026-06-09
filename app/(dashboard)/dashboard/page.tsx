import type { Metadata } from "next";
import Link from "next/link";
import { Users, FileText, Bell, Wallet, CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { formatCurrency, cn } from "@/lib/utils";
import { isOverdue, displayStatus, daysOverdue } from "@/lib/invoices/status";
import { eligibleSteps, canBeReminded } from "@/lib/reminders/eligible-steps";
import {
  invoiceStatusLabels,
  invoiceStatusVariants,
  invoiceStatusBadgeClasses,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

// Buckets d'ancienneté du retard (jours après échéance), du plus calme au plus tendu.
const AGING_BUCKETS = [
  { key: "0-30", label: "0–30 j", min: 1, max: 30 },
  { key: "31-60", label: "31–60 j", min: 31, max: 60 },
  { key: "61+", label: "61+ j", min: 61, max: Infinity },
] as const;

// Tons des cartes d'ancienneté : Ambre → Brique légère → Brique.
const AGING_CARD_CLASSES: Record<string, string> = {
  "0-30": "border-warning/30 bg-warning/5",
  "31-60": "border-destructive/20 bg-destructive/5",
  "61+": "border-destructive/40 bg-destructive/10",
};
const AGING_AMOUNT_CLASSES: Record<string, string> = {
  "0-30": "text-warning",
  "31-60": "text-destructive/80",
  "61+": "text-destructive",
};

export default async function DashboardPage() {
  const org = await getCurrentOrganization();

  const [sequence, invoices, activeClients] = await Promise.all([
    prisma.reminderSequence.findFirst({
      where: { organizationId: org.id, isActive: true },
      include: {
        steps: { where: { isActive: true }, select: { offsetDays: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { organizationId: org.id },
      orderBy: { dueAt: "asc" },
      select: {
        id: true,
        number: true,
        amountCents: true,
        currency: true,
        status: true,
        dueAt: true,
        paidAt: true,
        client: { select: { name: true } },
        reminderEvents: { select: { offsetDays: true, status: true } },
      },
    }),
    prisma.client.count({
      where: { organizationId: org.id, status: "ACTIVE" },
    }),
  ]);

  // Devise dominante pour l'affichage des montants agrégés.
  const currency = invoices[0]?.currency ?? "CAD";

  // ── KPIs ────────────────────────────────────────────────────
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
    { label: "Factures en retard", value: String(overdueCount), icon: FileText },
    { label: "Montant payé", value: formatCurrency(paidCents, currency), icon: Bell },
    { label: "Clients actifs", value: String(activeClients), icon: Users },
  ];

  // ── À relancer aujourd'hui ──────────────────────────────────
  const activeSteps = sequence?.steps ?? [];
  const toRemind = invoices
    .filter(
      (inv) => eligibleSteps(inv, activeSteps, inv.reminderEvents).length > 0
    )
    .sort((a, b) => daysOverdue(b) - daysOverdue(a));

  // ── Répartition d'ancienneté (factures en retard, ni payées ni annulées) ──
  const overdueInvoices = invoices.filter(canBeReminded);
  const aging = AGING_BUCKETS.map((bucket) => {
    const items = overdueInvoices.filter((inv) => {
      const late = daysOverdue(inv);
      return late >= bucket.min && late <= bucket.max;
    });
    return {
      ...bucket,
      count: items.length,
      amountCents: items.reduce((sum, inv) => sum + inv.amountCents, 0),
    };
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* À relancer aujourd'hui */}
      <Card>
        <CardHeader>
          <CardTitle>À relancer aujourd&apos;hui</CardTitle>
          <CardDescription>
            Factures dont au moins une étape de la séquence active est éligible.
          </CardDescription>
        </CardHeader>
        {toRemind.length === 0 ? (
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Aucune relance à envoyer aujourd&apos;hui.
              </p>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <ul className="divide-y">
              {toRemind.map((inv) => {
                const shown = displayStatus(inv);
                const late = daysOverdue(inv);
                return (
                  <li key={inv.id}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-3 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {inv.client.name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {inv.number}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden whitespace-nowrap text-xs text-destructive sm:inline">
                          {late} j de retard
                        </span>
                        <Badge
                          variant={invoiceStatusVariants[shown]}
                          className={invoiceStatusBadgeClasses[shown]}
                        >
                          {invoiceStatusLabels[shown]}
                        </Badge>
                        <span className="font-mono text-sm font-medium tabular-nums">
                          {formatCurrency(inv.amountCents, inv.currency)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        )}
      </Card>

      {/* Répartition d'ancienneté */}
      <div className="grid gap-4 sm:grid-cols-3">
        {aging.map((bucket) => {
          // La teinte d'alerte n'apparaît que si le bucket porte un vrai
          // encours ; sinon il reste neutre (Brume / muted-foreground).
          const tense = bucket.count > 0 && bucket.amountCents > 0;
          return (
            <Card
              key={bucket.key}
              className={cn(
                "border",
                tense ? AGING_CARD_CLASSES[bucket.key] : "bg-muted/40"
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {bucket.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-2xl font-semibold tabular-nums",
                    tense ? AGING_AMOUNT_CLASSES[bucket.key] : "text-muted-foreground"
                  )}
                >
                  {formatCurrency(bucket.amountCents, currency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {bucket.count} facture{bucket.count > 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
