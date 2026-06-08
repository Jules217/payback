import type { InvoiceStatus } from "@/types";

/**
 * Sous-ensemble des champs d'une facture nécessaires au calcul du retard.
 * Compatible avec les objets renvoyés par Prisma.
 */
export type InvoiceStatusInput = {
  status: InvoiceStatus;
  dueAt: Date | string;
  paidAt?: Date | null;
};

/**
 * Une facture est considérée en retard si :
 * - son statut est SENT ou PENDING,
 * - elle n'est pas payée (paidAt null),
 * - et son échéance est dans le passé.
 *
 * Le retard n'est PAS muté en base : il est calculé pour l'affichage.
 * L'automatisation (passage en OVERDUE) viendra plus tard via cron.
 */
export function isOverdue(invoice: InvoiceStatusInput): boolean {
  if (invoice.status !== "SENT" && invoice.status !== "PENDING") return false;
  if (invoice.paidAt) return false;
  return new Date(invoice.dueAt).getTime() < Date.now();
}

/** Statut affiché : OVERDUE si en retard calculé, sinon le statut réel. */
export function displayStatus(invoice: InvoiceStatusInput): InvoiceStatus {
  return isOverdue(invoice) ? "OVERDUE" : invoice.status;
}

/** Nombre de jours de retard (0 si l'échéance n'est pas dépassée). */
export function daysOverdue(invoice: InvoiceStatusInput): number {
  const diff = Date.now() - new Date(invoice.dueAt).getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
