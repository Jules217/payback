import type { InvoiceStatus, ReminderEventStatus } from "@/types";
import { daysOverdue } from "@/lib/invoices/status";

/** Champs d'une facture nécessaires au calcul d'éligibilité. */
export type EligibilityInvoice = {
  status: InvoiceStatus;
  dueAt: Date | string;
  paidAt?: Date | null;
};

/** Étape de relance (sous-ensemble minimal). */
export type EligibilityStep = {
  offsetDays: number;
};

/** Événement de relance déjà enregistré (sous-ensemble minimal). */
export type EligibilityEvent = {
  offsetDays?: number | null;
  status: ReminderEventStatus;
};

/** Statuts qui « consomment » une étape (déjà en file, simulée ou envoyée). */
const CONSUMING_STATUSES: ReminderEventStatus[] = ["SCHEDULED", "SIMULATED", "SENT"];

/** Décalages d'étapes déjà déclenchés pour une facture. */
export function consumedOffsets(events: EligibilityEvent[]): Set<number> {
  const set = new Set<number>();
  for (const e of events) {
    if (e.offsetDays != null && CONSUMING_STATUSES.includes(e.status)) {
      set.add(e.offsetDays);
    }
  }
  return set;
}

/** Une facture peut-elle recevoir des relances ? (ni payée, ni annulée, en retard) */
export function canBeReminded(invoice: EligibilityInvoice): boolean {
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") return false;
  if (invoice.paidAt) return false;
  return daysOverdue(invoice) > 0;
}

/**
 * Retourne les étapes applicables à une facture, triées par décalage croissant.
 *
 * Une étape J+N est applicable si :
 * - la facture peut être relancée (en retard, ni payée ni annulée),
 * - le retard atteint le décalage de l'étape (daysOverdue >= N),
 * - aucune relance n'a déjà été simulée/envoyée pour ce décalage.
 */
export function eligibleSteps<T extends EligibilityStep>(
  invoice: EligibilityInvoice,
  steps: T[],
  events: EligibilityEvent[]
): T[] {
  if (!canBeReminded(invoice)) return [];

  const overdue = daysOverdue(invoice);
  const done = consumedOffsets(events);

  return steps
    .filter(
      (s) => s.offsetDays > 0 && overdue >= s.offsetDays && !done.has(s.offsetDays)
    )
    .sort((a, b) => a.offsetDays - b.offsetDays);
}

/**
 * Compte, pour chaque décalage d'étape, le nombre de factures actuellement
 * éligibles. Les étapes passées sont supposées déjà filtrées (actives).
 */
export function countEligibleByOffset<T extends EligibilityStep>(
  invoices: (EligibilityInvoice & { reminderEvents: EligibilityEvent[] })[],
  steps: T[]
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const step of steps) counts.set(step.offsetDays, 0);
  for (const invoice of invoices) {
    for (const step of eligibleSteps(invoice, steps, invoice.reminderEvents)) {
      counts.set(step.offsetDays, (counts.get(step.offsetDays) ?? 0) + 1);
    }
  }
  return counts;
}
