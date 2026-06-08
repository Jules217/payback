import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { createInvoice } from "@/app/(dashboard)/invoices/actions";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { toDateInputValue } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Nouvelle facture" };
export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const org = await getCurrentOrganization();
  const clients = await prisma.client.findMany({
    where: { organizationId: org.id, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, companyName: true },
  });

  const today = toDateInputValue(new Date());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux factures
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle facture</CardTitle>
          <CardDescription>
            Rattachez une facture à un client et définissez son échéance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Aucun client actif. Créez d&apos;abord un client pour pouvoir
                lui rattacher une facture.
              </p>
              <Link
                href="/clients/new"
                className={buttonVariants({ variant: "outline" })}
              >
                Nouveau client
              </Link>
            </div>
          ) : (
            <InvoiceForm
              action={createInvoice}
              clients={clients}
              submitLabel="Créer la facture"
              cancelHref="/invoices"
              defaults={{
                currency: "CAD",
                status: "DRAFT",
                issuedAt: today,
                dueAt: today,
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
