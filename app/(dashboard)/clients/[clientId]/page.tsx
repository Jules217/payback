import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Pencil, Archive } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { archiveClient } from "@/app/(dashboard)/clients/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { displayStatus } from "@/lib/invoices/status";
import {
  channelLabels,
  languageLabels,
  clientStatusLabels,
  clientStatusVariants,
  invoiceStatusLabels,
  invoiceStatusVariants,
  invoiceStatusBadgeClasses,
} from "@/lib/labels";
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

type PageProps = { params: Promise<{ clientId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true },
  });
  return { title: client?.name ?? "Client" };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { clientId } = await params;
  const org = await getCurrentOrganization();

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: org.id },
    include: {
      invoices: { orderBy: { dueAt: "desc" } },
    },
  });

  if (!client) notFound();

  const archive = archiveClient.bind(null, client.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux clients
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{client.name}</h2>
            <Badge variant={clientStatusVariants[client.status]}>
              {clientStatusLabels[client.status]}
            </Badge>
          </div>
          {client.companyName ? (
            <p className="text-muted-foreground">{client.companyName}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${client.id}/edit`}
            className={buttonVariants({ variant: "outline", className: "gap-2" })}
          >
            <Pencil className="size-4" />
            Modifier
          </Link>
          {client.status === "ACTIVE" ? (
            <form action={archive}>
              <Button type="submit" variant="outline" className="gap-2">
                <Archive className="size-4" />
                Archiver
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow label="Email" value={client.email ?? "—"} />
            <InfoRow label="Téléphone" value={client.phone ?? "—"} />
            <InfoRow
              label="Canal préféré"
              value={channelLabels[client.preferredChannel]}
            />
            <InfoRow label="Langue" value={languageLabels[client.language]} />
            <InfoRow label="Créé le" value={formatDate(client.createdAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {client.notes ? (
              <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune note.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
          <CardDescription>
            Factures associées à ce client.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {client.invoices.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Aucune facture pour ce client.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.invoices.map((invoice) => {
                  const shown = displayStatus(invoice);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-medium">
                        {invoice.number}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(invoice.amountCents, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.dueAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={invoiceStatusVariants[shown]}
                          className={invoiceStatusBadgeClasses[shown]}
                        >
                          {invoiceStatusLabels[shown]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/invoices/${invoice.id}`}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
