import { AlertTriangle } from "lucide-react";

import type { ReminderChannel, ReminderTone } from "@/types";
import {
  reminderChannelLabels,
  reminderToneLabels,
  reminderToneVariants,
  stepOffsetLabel,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SequenceStepRow = {
  id: string;
  offsetDays: number;
  channel: ReminderChannel;
  isActive: boolean;
  template: { name: string; tone: ReminderTone; isActive: boolean } | null;
};

interface SequenceStepsTableProps {
  steps: SequenceStepRow[];
  /** Nombre de factures éligibles par décalage (étapes actives uniquement). */
  eligibleCountByOffset: Map<number, number>;
}

export function SequenceStepsTable({
  steps,
  eligibleCountByOffset,
}: SequenceStepsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Étape</TableHead>
          <TableHead>Canal</TableHead>
          <TableHead>Ton</TableHead>
          <TableHead>Modèle</TableHead>
          <TableHead className="text-right">Factures éligibles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {steps.map((step) => (
          <TableRow key={step.id} className={step.isActive ? "" : "opacity-60"}>
            <TableCell className="font-medium">
              <span className="inline-flex items-center gap-2">
                {stepOffsetLabel(step.offsetDays)}
                {!step.isActive ? (
                  <Badge variant="outline">Inactive</Badge>
                ) : null}
              </span>
            </TableCell>
            <TableCell>{reminderChannelLabels[step.channel]}</TableCell>
            <TableCell>
              {step.template ? (
                <Badge variant={reminderToneVariants[step.template.tone]}>
                  {reminderToneLabels[step.template.tone]}
                </Badge>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {step.template ? (
                <span className="inline-flex items-center gap-1.5">
                  {step.template.name}
                  {!step.template.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="size-3.5" />
                      archivé
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <AlertTriangle className="size-3.5" />
                  aucun modèle
                </span>
              )}
            </TableCell>
            <TableCell className="text-right font-medium">
              {step.isActive
                ? eligibleCountByOffset.get(step.offsetDays) ?? 0
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Détecte les étapes actives dont le modèle est manquant ou archivé. */
export function hasTemplateIssues(steps: SequenceStepRow[]): boolean {
  return steps.some(
    (s) => s.isActive && (!s.template || !s.template.isActive)
  );
}
