import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { updateInvoice } from "@/app/(dashboard)/invoices/actions";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { toDateInputValue } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Modifier la facture" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ invoiceId: string }> };

export default async function EditInvoicePage({ params }: PageProps) {
  const { invoiceId } = await params;
  const org = await getCurrentOrganization();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: org.id },
  });

  if (!invoice) notFound();

  const clients = await prisma.client.findMany({
    where: { organizationId: org.id, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, companyName: true },
  });

  // Le client rattaché peut être archivé : on l'inclut quand même pour éviter
  // de le perdre dans le sélecteur.
  const hasClient = clients.some((c) => c.id === invoice.clientId);
  if (!hasClient) {
    const current = await prisma.client.findUnique({
      where: { id: invoice.clientId },
      select: { id: true, name: true, companyName: true },
    });
    if (current) clients.unshift(current);
  }

  const updateAction = updateInvoice.bind(null, invoice.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/invoices/${invoice.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour à la facture
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Modifier la facture</CardTitle>
          <CardDescription>
            Mettez à jour les informations de la facture {invoice.number}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            action={updateAction}
            clients={clients}
            submitLabel="Enregistrer les modifications"
            cancelHref={`/invoices/${invoice.id}`}
            defaults={{
              clientId: invoice.clientId,
              number: invoice.number,
              amount: (invoice.amountCents / 100).toString(),
              currency: invoice.currency,
              issuedAt: toDateInputValue(invoice.issuedAt),
              dueAt: toDateInputValue(invoice.dueAt),
              status: invoice.status,
              paymentUrl: invoice.paymentUrl ?? "",
              description: invoice.description ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
