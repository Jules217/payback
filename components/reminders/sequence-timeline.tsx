import { AlertTriangle, Mail, MessageSquare } from "lucide-react";

import type { ReminderChannel, ReminderTone } from "@/types";
import {
  reminderToneLabels,
  reminderToneVariants,
  stepOffsetLabel,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type SequenceStepRow = {
  id: string;
  offsetDays: number;
  channel: ReminderChannel;
  isActive: boolean;
  template: { name: string; tone: ReminderTone; isActive: boolean } | null;
};

interface SequenceTimelineProps {
  steps: SequenceStepRow[];
  /** Nombre de factures éligibles par décalage (étapes actives uniquement). */
  eligibleCountByOffset: Map<number, number>;
}

/** Couleur du nœud selon le ton : Sauge (GENTLE) · Encre (PROFESSIONAL) · Brique (FIRM). */
function toneDotClass(tone: ReminderTone | null): string {
  switch (tone) {
    case "GENTLE":
      return "bg-success";
    case "FIRM":
      return "bg-destructive";
    case "PROFESSIONAL":
      return "bg-primary";
    default:
      return "bg-muted-foreground/40";
  }
}

/**
 * Timeline de relance — la signature visuelle de Payback. Horizontale en ≥ md
 * (nœuds reliés par une ligne fine, contenu centré sous chaque nœud), verticale
 * en mobile (ligne à gauche, nœuds à gauche).
 */
export function SequenceTimeline({
  steps,
  eligibleCountByOffset,
}: SequenceTimelineProps) {
  if (steps.length === 0) {
    return (
      <p className="px-6 pb-6 text-sm text-muted-foreground">
        Aucune étape configurée.
      </p>
    );
  }

  return (
    <ol className="flex flex-col px-6 pb-6 pt-2 md:flex-row md:items-start md:px-4 md:pt-4">
      {steps.map((step, i) => {
        const isFirst = i === 0;
        const isLast = i === steps.length - 1;
        const tone = step.template?.tone ?? null;
        const ChannelIcon = step.channel === "SMS" ? MessageSquare : Mail;
        const eligible = step.isActive
          ? eligibleCountByOffset.get(step.offsetDays) ?? 0
          : null;

        return (
          <li
            key={step.id}
            className={cn(
              "flex gap-4 md:flex-1 md:flex-col md:gap-0",
              !step.isActive && "opacity-60"
            )}
          >
            {/* Rail vertical (mobile) : nœud en haut, ligne descendante à gauche */}
            <div className="flex flex-col items-center md:hidden">
              <span
                className={cn(
                  "size-4 shrink-0 rounded-full ring-4 ring-background",
                  toneDotClass(tone)
                )}
              />
              {!isLast ? <span className="w-px flex-1 bg-border" /> : null}
            </div>

            {/* Rail horizontal (desktop) : ligne traversante, nœud centré */}
            <div className="hidden md:flex md:items-center">
              <span
                className={cn("h-px flex-1 bg-border", isFirst && "invisible")}
              />
              <span
                className={cn(
                  "size-4 shrink-0 rounded-full ring-4 ring-background",
                  toneDotClass(tone)
                )}
              />
              <span
                className={cn("h-px flex-1 bg-border", isLast && "invisible")}
              />
            </div>

            {/* Contenu du nœud */}
            <div
              className={cn(
                "md:px-2 md:pb-0 md:pt-3 md:text-center",
                isLast ? "pb-0" : "pb-8"
              )}
            >
              <p className="font-display text-sm font-medium tracking-tight">
                {stepOffsetLabel(step.offsetDays)}
              </p>

              <div className="mt-1.5 flex items-center gap-1.5 md:justify-center">
                <ChannelIcon className="size-3.5 shrink-0 text-muted-foreground" />
                {step.template ? (
                  <Badge variant={reminderToneVariants[step.template.tone]}>
                    {reminderToneLabels[step.template.tone]}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <AlertTriangle className="size-3" />
                    aucun modèle
                  </Badge>
                )}
                {!step.isActive ? (
                  <Badge variant="outline">Inactive</Badge>
                ) : null}
              </div>

              {step.template ? (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {step.template.name}
                  {!step.template.isActive ? (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="size-3" />
                      archivé
                    </span>
                  ) : null}
                </p>
              ) : null}

              {eligible !== null ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {eligible} éligible{eligible > 1 ? "s" : ""}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Détecte les étapes actives dont le modèle est manquant ou archivé. */
export function hasTemplateIssues(steps: SequenceStepRow[]): boolean {
  return steps.some((s) => s.isActive && (!s.template || !s.template.isActive));
}
