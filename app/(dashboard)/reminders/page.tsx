import Link from "next/link";
import type { Metadata } from "next";
import { Bell, Pencil, AlertTriangle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { countEligibleByOffset } from "@/lib/reminders/eligible-steps";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SequenceTimeline,
  hasTemplateIssues,
  type SequenceStepRow,
} from "@/components/reminders/sequence-timeline";

export const metadata: Metadata = { title: "Relances" };
export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const org = await getCurrentOrganization();

  const [sequence, invoices] = await Promise.all([
    prisma.reminderSequence.findFirst({
      where: { organizationId: org.id, isActive: true },
      include: {
        steps: { orderBy: { order: "asc" }, include: { template: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { organizationId: org.id },
      select: {
        status: true,
        dueAt: true,
        paidAt: true,
        reminderEvents: { select: { offsetDays: true, status: true } },
      },
    }),
  ]);

  const steps: SequenceStepRow[] = sequence?.steps ?? [];
  const activeSteps = steps.filter((s) => s.isActive);
  const eligibleCountByOffset = countEligibleByOffset(invoices, activeSteps);
  const templateAlert = hasTemplateIssues(steps);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Relances</h2>
            <p className="text-sm text-muted-foreground">
              Scénario de relance amiable de {org.name}
            </p>
          </div>
        </div>
        {sequence ? (
          <Link
            href={`/reminders/${sequence.id}/edit`}
            className={buttonVariants({ variant: "outline", className: "gap-2" })}
          >
            <Pencil className="size-4" />
            Modifier la séquence
          </Link>
        ) : null}
      </div>

      {!sequence ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune séquence active. Lancez le seed pour créer la séquence de
            démonstration.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{sequence.name}</CardTitle>
            <CardDescription>
              Étapes déclenchées selon le nombre de jours de retard après
              l&apos;échéance. La simulation se lance depuis le détail d&apos;une
              facture.
            </CardDescription>
          </CardHeader>
          {templateAlert ? (
            <CardContent className="pt-0">
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                Une étape active utilise un modèle archivé ou manquant. Modifiez
                la séquence pour la corriger.
              </div>
            </CardContent>
          ) : null}
          <CardContent className="p-0">
            <SequenceTimeline
              steps={steps}
              eligibleCountByOffset={eligibleCountByOffset}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
