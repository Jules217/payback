import Link from "next/link";
import type { Metadata } from "next";
import { Plus, FileText } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  invoiceStatusLabels,
  invoiceStatusVariants,
  invoiceStatusBadgeClasses,
} from "@/lib/labels";
import { displayStatus, daysOverdue } from "@/lib/invoices/status";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InvoiceStatus } from "@/types";

export const metadata: Metadata = { title: "Factures" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "overdue", label: "En retard" },
  { key: "pending", label: "En attente" },
  { key: "paid", label: "Payées" },
  { key: "cancelled", label: "Annulées" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function matchesFilter(filter: FilterKey, shown: InvoiceStatus): boolean {
  switch (filter) {
    case "overdue":
      return shown === "OVERDUE";
    case "pending":
      return shown === "PENDING" || shown === "SENT" || shown === "DRAFT";
    case "paid":
      return shown === "PAID";
    case "cancelled":
      return shown === "CANCELLED";
    default:
      return true;
  }
}

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function InvoicesPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const activeFilter: FilterKey =
    FILTERS.find((f) => f.key === status)?.key ?? "all";

  const org = await getCurrentOrganization();
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: org.id },
    orderBy: { dueAt: "asc" },
    include: { client: { select: { id: true, name: true } } },
  });

  // Statuts affichés (retard calculé inclus) — base des counts et du filtrage.
  const shownStatuses = invoices.map((inv) => displayStatus(inv));

  const counts: Record<FilterKey, number> = {
    all: invoices.length,
    overdue: shownStatuses.filter((s) => s === "OVERDUE").length,
    pending: shownStatuses.filter((s) =>
      ["PENDING", "SENT", "DRAFT"].includes(s)
    ).length,
    paid: shownStatuses.filter((s) => s === "PAID").length,
    cancelled: shownStatuses.filter((s) => s === "CANCELLED").length,
  };

  // Résumé financier : montant total à encaisser (ni payé ni annulé)
  const unpaidCents = invoices
    .filter((inv) => inv.status !== "PAID" && inv.status !== "CANCELLED")
    .reduce((sum, inv) => sum + inv.amountCents, 0);
  const dominantCurrency = invoices.find((inv) => inv.currency)?.currency ?? "CAD";

  const rows = invoices
    .map((inv, i) => ({ inv, shown: shownStatuses[i] }))
    .filter(({ shown }) => matchesFilter(activeFilter, shown));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Factures</h2>
          <p className="text-sm text-muted-foreground">
            {invoices.length} facture{invoices.length > 1 ? "s" : ""} dans{" "}
            {org.name}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className={buttonVariants({ className: "gap-2" })}
        >
          <Plus className="size-4" />
          Nouvelle facture
        </Link>
      </div>

      {/* Résumé financier */}
      {invoices.length > 0 ? (
        <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border bg-card px-4 py-3 text-sm">
          <span>
            <span
              className={cn(
                "font-semibold",
                counts.overdue > 0 ? "text-destructive" : "text-foreground"
              )}
            >
              {counts.overdue}
            </span>{" "}
            <span className="text-muted-foreground">
              facture{counts.overdue > 1 ? "s" : ""} en retard
            </span>
          </span>
          <span className="text-muted-foreground hidden sm:inline">·</span>
          <span>
            <span className="font-semibold">
              {formatCurrency(unpaidCents, dominantCurrency)}
            </span>{" "}
            <span className="text-muted-foreground">à encaisser</span>
          </span>
          <span className="text-muted-foreground hidden sm:inline">·</span>
          <span>
            <span className="font-semibold">{counts.pending}</span>{" "}
            <span className="text-muted-foreground">en attente</span>
          </span>
        </div>
      ) : null}

      {/* Filtres avec compteurs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const href =
            f.key === "all" ? "/invoices" : `/invoices?status=${f.key}`;
          const isActive = f.key === activeFilter;
          return (
            <Link
              key={f.key}
              href={href}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {f.label}{" "}
              <span
                className={cn(
                  "text-xs",
                  isActive
                    ? "opacity-75"
                    : counts[f.key] > 0 && f.key === "overdue"
                    ? "font-semibold text-destructive"
                    : "opacity-60"
                )}
              >
                ({counts[f.key]})
              </span>
            </Link>
          );
        })}
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="size-6" />
            </div>
            <div>
              <p className="font-medium">Aucune facture pour l&apos;instant</p>
              <p className="text-sm text-muted-foreground">
                Créez votre première facture pour suivre les échéances et les
                retards.
              </p>
            </div>
            <Link
              href="/invoices/new"
              className={buttonVariants({ className: "gap-2" })}
            >
              <Plus className="size-4" />
              Nouvelle facture
            </Link>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune facture pour ce filtre.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Émission</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ inv, shown }) => {
                  const late = shown === "OVERDUE" ? daysOverdue(inv) : 0;
                  return (
                    <TableRow
                      key={inv.id}
                      className={late > 0 ? "bg-destructive/5" : undefined}
                    >
                      <TableCell className="font-mono font-medium">
                        {inv.number}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.client.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(inv.amountCents, inv.currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.issuedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.dueAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge
                            variant={invoiceStatusVariants[shown]}
                            className={invoiceStatusBadgeClasses[shown]}
                          >
                            {invoiceStatusLabels[shown]}
                          </Badge>
                          {late > 0 ? (
                            <span className="text-xs text-muted-foreground">
                              {late} jour{late > 1 ? "s" : ""} de retard
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Voir
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
