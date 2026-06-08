import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { updateClient } from "@/app/(dashboard)/clients/actions";
import { ClientForm } from "@/components/clients/client-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Modifier le client" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ clientId: string }> };

export default async function EditClientPage({ params }: PageProps) {
  const { clientId } = await params;
  const org = await getCurrentOrganization();

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: org.id },
  });

  if (!client) notFound();

  const updateAction = updateClient.bind(null, client.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/clients/${client.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour au client
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Modifier le client</CardTitle>
          <CardDescription>
            Mettez à jour les informations de {client.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            action={updateAction}
            submitLabel="Enregistrer les modifications"
            cancelHref={`/clients/${client.id}`}
            defaults={{
              name: client.name,
              companyName: client.companyName ?? "",
              email: client.email ?? "",
              phone: client.phone ?? "",
              preferredChannel: client.preferredChannel,
              language: client.language,
              notes: client.notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
