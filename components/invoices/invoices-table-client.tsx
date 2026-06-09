"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListChecks } from "lucide-react";

import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  invoiceStatusLabels,
  invoiceStatusVariants,
  invoiceStatusBadgeClasses,
} from "@/lib/labels";
import { daysOverdue } from "@/lib/invoices/status";
import { batchEnqueueReminders } from "@/app/(dashboard)/invoices/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

export type InvoiceRow = {
  id: string;
  number: string;
  amountCents: number;
  currency: string;
  issuedAt: string;
  dueAt: string;
  shown: InvoiceStatus;
  clientId: string;
  clientName: string;
};

interface InvoicesTableClientProps {
  rows: InvoiceRow[];
}

export function InvoicesTableClient({ rows }: InvoicesTableClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ message: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Clear selection when rows change (filter navigation).
  useEffect(() => {
    setSelectedIds(new Set());
  }, [rows]);

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBatchEnqueue() {
    startTransition(async () => {
      const result = await batchEnqueueReminders(Array.from(selectedIds));
      setFeedback({ message: result.message, ok: result.ok });
      setSelectedIds(new Set());
      router.refresh();
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Aucune facture pour ce filtre.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Barre d'action batch */}
      {(selectedIds.size > 0 || feedback) && (
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} facture${selectedIds.size > 1 ? "s" : ""} sélectionnée${selectedIds.size > 1 ? "s" : ""}`
              : null}
            {feedback && (
              <span
                className={cn(
                  "font-medium",
                  feedback.ok ? "text-success" : "text-destructive"
                )}
              >
                {feedback.message}
              </span>
            )}
          </span>
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isPending}
              onClick={handleBatchEnqueue}
            >
              <ListChecks className="size-4" />
              {isPending
                ? "Mise en file…"
                : `Ajouter à la file (${selectedIds.size})`}
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Sélectionner tout"
                  />
                </TableHead>
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
              {rows.map((row) => {
                const late = row.shown === "OVERDUE" ? daysOverdue({ dueAt: row.dueAt, status: row.shown }) : 0;
                const isSelected = selectedIds.has(row.id);
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      late > 0 ? "bg-destructive/5" : undefined,
                      isSelected ? "bg-accent/50" : undefined
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(row.id)}
                        aria-label={`Sélectionner ${row.number}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {row.number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.clientName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.amountCents, row.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.issuedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.dueAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          variant={invoiceStatusVariants[row.shown]}
                          className={invoiceStatusBadgeClasses[row.shown]}
                        >
                          {invoiceStatusLabels[row.shown]}
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
                        href={`/invoices/${row.id}`}
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
    </div>
  );
}
