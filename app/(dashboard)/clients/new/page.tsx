import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/app/(dashboard)/clients/actions";
import { ClientForm } from "@/components/clients/client-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Nouveau client" };

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux clients
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau client</CardTitle>
          <CardDescription>
            Renseignez les informations du client. Seul le nom est obligatoire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            action={createClient}
            submitLabel="Créer le client"
            cancelHref="/clients"
          />
        </CardContent>
      </Card>
    </div>
  );
}
