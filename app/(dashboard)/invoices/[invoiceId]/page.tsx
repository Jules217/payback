import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Pencil,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import {
  markInvoiceAsPaid,
  cancelInvoice,
} from "@/app/(dashboard)/invoices/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { invoiceStatusLabels, invoiceStatusVariants } from "@/lib/labels";
import { displayStatus, daysOverdue } from "@/lib/invoices/status";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ invoiceId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { invoiceId } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { number: true },
  });
  return { title: invoice ? `Facture ${invoice.number}` : "Facture" };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { invoiceId } = await params;
  const org = await getCurrentOrganization();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: org.id },
    include: {
      client: true,
      reminderEvents: { orderBy: { scheduledAt: "desc" } },
    },
  });

  if (!invoice) notFound();

  const shown = displayStatus(invoice);
  const late = shown === "OVERDUE" ? daysOverdue(invoice) : 0;
  const isClosed = invoice.status === "PAID" || invoice.status === "CANCELLED";

  const markPaid = markInvoiceAsPaid.bind(null, invoice.id);
  const cancel = cancelInvoice.bind(null, invoice.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux factures
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{invoice.number}</h2>
            <Badge variant={invoiceStatusVariants[shown]}>
              {invoiceStatusLabels[shown]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            <Link
              href={`/clients/${invoice.client.id}`}
              className="hover:text-foreground hover:underline"
            >
              {invoice.client.name}
            </Link>
            {invoice.client.companyName
              ? ` — ${invoice.client.companyName}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!isClosed ? (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className={buttonVariants({
                variant: "outline",
                className: "gap-2",
              })}
            >
              <Pencil className="size-4" />
              Modifier
            </Link>
          ) : null}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
            <form action={markPaid}>
              <Button type="submit" className="gap-2">
                <CheckCircle2 className="size-4" />
                Marquer payée
              </Button>
            </form>
          ) : null}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
            <form action={cancel}>
              <Button type="submit" variant="outline" className="gap-2">
                <XCircle className="size-4" />
                Annuler
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {late > 0 ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          En retard de {late} jour{late > 1 ? "s" : ""} sur l&apos;échéance.
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow
              label="Montant"
              value={formatCurrency(invoice.amountCents, invoice.currency)}
            />
            <InfoRow
              label="Statut réel"
              value={invoiceStatusLabels[invoice.status]}
            />
            <InfoRow
              label="Émission"
              value={formatDate(invoice.issuedAt)}
            />
            <InfoRow label="Échéance" value={formatDate(invoice.dueAt)} />
            <InfoRow
              label="Payée le"
              value={invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
            />
            <InfoRow
              label="Lien de paiement"
              value={
                invoice.paymentUrl ? (
                  <a
                    href={invoice.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Ouvrir
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.description ? (
              <p className="whitespace-pre-wrap text-sm">
                {invoice.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune description.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des relances</CardTitle>
          <CardDescription>
            Relances programmées et envoyées pour cette facture.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invoice.reminderEvents.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Aucune relance pour l&apos;instant. L&apos;envoi de relances sera
              disponible dans une prochaine étape.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Programmée</TableHead>
                  <TableHead>Envoyée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.reminderEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.channel}</TableCell>
                    <TableCell>{event.status}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(event.scheduledAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.sentAt ? formatDate(event.sentAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
