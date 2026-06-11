import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Pencil, Archive, RotateCcw } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import {
  archiveTemplate,
  restoreTemplate,
} from "@/app/(dashboard)/templates/actions";
import {
  reminderChannelLabels,
  reminderToneLabels,
  reminderToneVariants,
  languageLabels,
  stepOffsetLabel,
} from "@/lib/labels";
import { renderPreview } from "@/lib/reminders/preview";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ templateId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { templateId } = await params;
  const org = await getCurrentOrganization();
  const template = await prisma.messageTemplate.findFirst({
    where: { id: templateId, organizationId: org.id },
    select: { name: true },
  });
  return { title: template?.name ?? "Modèle · Payback" };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { templateId } = await params;
  const org = await getCurrentOrganization();

  const template = await prisma.messageTemplate.findFirst({
    where: { id: templateId, organizationId: org.id },
    include: {
      steps: {
        include: { sequence: { select: { id: true, name: true } } },
        orderBy: { offsetDays: "asc" },
      },
    },
  });

  if (!template) notFound();

  const preview = renderPreview(template.subject ?? "", template.body);
  const archive = archiveTemplate.bind(null, template.id);
  const restore = restoreTemplate.bind(null, template.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux modèles
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{template.name}</h2>
            <Badge variant={reminderToneVariants[template.tone]}>
              {reminderToneLabels[template.tone]}
            </Badge>
            {!template.isActive ? <Badge variant="outline">Archivé</Badge> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/templates/${template.id}/edit`}
            className={buttonVariants({ variant: "outline", className: "gap-2" })}
          >
            <Pencil className="size-4" />
            Modifier
          </Link>
          {template.isActive ? (
            <form action={archive}>
              <Button type="submit" variant="outline" className="gap-2">
                <Archive className="size-4" />
                Archiver
              </Button>
            </form>
          ) : (
            <form action={restore}>
              <Button type="submit" variant="outline" className="gap-2">
                <RotateCcw className="size-4" />
                Réactiver
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow
              label="Canal"
              value={reminderChannelLabels[template.channel]}
            />
            <InfoRow label="Ton" value={reminderToneLabels[template.tone]} />
            <InfoRow
              label="Langue"
              value={languageLabels[template.language]}
            />
            <InfoRow
              label="Statut"
              value={template.isActive ? "Actif" : "Archivé"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilisé par</CardTitle>
            <CardDescription>Étapes de relance liées.</CardDescription>
          </CardHeader>
          <CardContent>
            {template.steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune étape n&apos;utilise ce modèle.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {template.steps.map((step) => (
                  <li key={step.id} className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {stepOffsetLabel(step.offsetDays)}
                    </Badge>
                    <Link
                      href={`/reminders/${step.sequence.id}`}
                      className="text-primary hover:underline"
                    >
                      {step.sequence.name}
                    </Link>
                    {!step.isActive ? (
                      <span className="text-xs text-muted-foreground">
                        (étape inactive)
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
          <CardDescription>
            Rendu avec des données de démonstration ; aucune variable connue ne
            reste affichée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 rounded bg-muted/50 p-3 text-sm">
            {template.channel === "EMAIL" ? (
              <p className="font-medium">{preview.subject}</p>
            ) : null}
            <p className="whitespace-pre-wrap text-muted-foreground">
              {preview.body}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
