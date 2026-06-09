import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { updateTemplate } from "@/app/(dashboard)/templates/actions";
import { TemplateForm } from "@/components/templates/template-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Modifier le modèle" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ templateId: string }> };

export default async function EditTemplatePage({ params }: PageProps) {
  const { templateId } = await params;
  const org = await getCurrentOrganization();

  const template = await prisma.messageTemplate.findFirst({
    where: { id: templateId, organizationId: org.id },
  });

  if (!template) notFound();

  const updateAction = updateTemplate.bind(null, template.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/templates/${template.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour au modèle
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Modifier le modèle</CardTitle>
          <CardDescription>
            Mettez à jour {template.name}. La simulation utilisera la version la
            plus récente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm
            action={updateAction}
            submitLabel="Enregistrer les modifications"
            cancelHref={`/templates/${template.id}`}
            defaults={{
              name: template.name,
              channel: template.channel,
              tone: template.tone,
              language: template.language,
              subject: template.subject ?? "",
              body: template.body,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
