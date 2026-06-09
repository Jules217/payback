import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { updateSequence } from "@/app/(dashboard)/reminders/actions";
import { SequenceForm } from "@/components/reminders/sequence-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Modifier la séquence" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ sequenceId: string }> };

export default async function EditSequencePage({ params }: PageProps) {
  const { sequenceId } = await params;
  const org = await getCurrentOrganization();

  const [sequence, templates] = await Promise.all([
    prisma.reminderSequence.findFirst({
      where: { id: sequenceId, organizationId: org.id },
      include: { steps: { orderBy: { order: "asc" } } },
    }),
    prisma.messageTemplate.findMany({
      where: { organizationId: org.id },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isActive: true },
    }),
  ]);

  if (!sequence) notFound();

  const updateAction = updateSequence.bind(null, sequence.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/reminders/${sequence.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour à la séquence
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Modifier la séquence</CardTitle>
          <CardDescription>
            Ajustez les étapes (délai, canal, modèle, activation). Deux étapes
            actives ne peuvent pas partager le même délai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SequenceForm
            action={updateAction}
            defaultName={sequence.name}
            cancelHref={`/reminders/${sequence.id}`}
            templates={templates}
            initialSteps={sequence.steps.map((s) => ({
              id: s.id,
              offsetDays: String(s.offsetDays),
              channel: s.channel,
              templateId: s.templateId ?? "",
              isActive: s.isActive,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
