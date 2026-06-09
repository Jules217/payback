import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Pencil, AlertTriangle } from "lucide-react";

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
  SequenceStepsTable,
  hasTemplateIssues,
  type SequenceStepRow,
} from "@/components/reminders/sequence-steps-table";

export const metadata: Metadata = { title: "Séquence de relance" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ sequenceId: string }> };

export default async function SequenceDetailPage({ params }: PageProps) {
  const { sequenceId } = await params;
  const org = await getCurrentOrganization();

  const sequence = await prisma.reminderSequence.findFirst({
    where: { id: sequenceId, organizationId: org.id },
    include: {
      steps: { orderBy: { order: "asc" }, include: { template: true } },
    },
  });

  if (!sequence) notFound();

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: org.id },
    select: {
      status: true,
      dueAt: true,
      paidAt: true,
      reminderEvents: { select: { offsetDays: true, status: true } },
    },
  });

  const steps: SequenceStepRow[] = sequence.steps;
  const activeSteps = steps.filter((s) => s.isActive);
  const eligibleCountByOffset = countEligibleByOffset(invoices, activeSteps);
  const templateAlert = hasTemplateIssues(steps);

  return (
    <div className="space-y-6">
      <Link
        href="/reminders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux relances
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{sequence.name}</h2>
          <p className="text-sm text-muted-foreground">
            {sequence.isActive ? "Séquence active" : "Séquence inactive"}
          </p>
        </div>
        <Link
          href={`/reminders/${sequence.id}/edit`}
          className={buttonVariants({ variant: "outline", className: "gap-2" })}
        >
          <Pencil className="size-4" />
          Modifier
        </Link>
      </div>

      {templateAlert ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          Une étape active utilise un modèle archivé ou manquant. Modifiez la
          séquence pour la corriger.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Étapes</CardTitle>
          <CardDescription>
            Triées par délai après l&apos;échéance.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SequenceStepsTable
            steps={steps}
            eligibleCountByOffset={eligibleCountByOffset}
          />
        </CardContent>
      </Card>
    </div>
  );
}
