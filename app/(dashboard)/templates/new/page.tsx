import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { createTemplate } from "@/app/(dashboard)/templates/actions";
import { TemplateForm } from "@/components/templates/template-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Nouveau modèle" };

export default function NewTemplatePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux modèles
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau modèle</CardTitle>
          <CardDescription>
            Rédigez un modèle de relance. Utilisez les variables pour
            personnaliser le message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm
            action={createTemplate}
            submitLabel="Créer le modèle"
            cancelHref="/templates"
          />
        </CardContent>
      </Card>
    </div>
  );
}
