import type {
  PreferredChannel,
  Language,
  ClientStatus,
  InvoiceStatus,
  ReminderChannel,
  ReminderTone,
  ReminderEventStatus,
  ReminderDeliveryMode,
} from "@/types";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export const channelLabels: Record<PreferredChannel, string> = {
  EMAIL: "Email",
  SMS: "SMS",
  BOTH: "Email + SMS",
};

export const languageLabels: Record<Language, string> = {
  FR: "Français",
  EN: "English",
};

export const clientStatusLabels: Record<ClientStatus, string> = {
  ACTIVE: "Actif",
  ARCHIVED: "Archivé",
};

export const clientStatusVariants: Record<ClientStatus, BadgeVariant> = {
  ACTIVE: "secondary",
  ARCHIVED: "outline",
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée",
  PENDING: "En attente",
  OVERDUE: "En retard",
  PAID: "Payée",
  CANCELLED: "Annulée",
};

export const invoiceStatusVariants: Record<InvoiceStatus, BadgeVariant> = {
  DRAFT: "secondary",
  SENT: "outline",
  PENDING: "warning",
  OVERDUE: "destructive",
  PAID: "success",
  CANCELLED: "secondary",
};

/**
 * Classes additionnelles par statut de facture (au-delà du variant de badge).
 * `CANCELLED` reçoit un texte rayé pour signaler l'annulation sans alarmer.
 */
export const invoiceStatusBadgeClasses: Partial<Record<InvoiceStatus, string>> =
  {
    CANCELLED: "line-through",
  };

/** Libellés des devises pour les sélecteurs et l'affichage. */
export const currencyLabels: Record<string, string> = {
  CAD: "Dollar canadien (CAD)",
  USD: "Dollar US (USD)",
  EUR: "Euro (EUR)",
};

// ── Relances ──────────────────────────────────────────────────
export const reminderChannelLabels: Record<ReminderChannel, string> = {
  EMAIL: "Email",
  SMS: "SMS",
};

export const reminderToneLabels: Record<ReminderTone, string> = {
  GENTLE: "Doux",
  PROFESSIONAL: "Professionnel",
  FIRM: "Ferme",
};

export const reminderToneVariants: Record<ReminderTone, BadgeVariant> = {
  GENTLE: "success",
  PROFESSIONAL: "secondary",
  FIRM: "destructive",
};

export const reminderEventStatusLabels: Record<ReminderEventStatus, string> = {
  SCHEDULED: "Programmée",
  SIMULATED: "Simulée",
  SENT: "Envoyée",
  FAILED: "Échouée",
  CANCELLED: "Annulée",
};

export const reminderEventStatusVariants: Record<
  ReminderEventStatus,
  BadgeVariant
> = {
  SCHEDULED: "outline",
  SIMULATED: "secondary",
  SENT: "default",
  FAILED: "destructive",
  CANCELLED: "outline",
};

export const reminderDeliveryModeLabels: Record<ReminderDeliveryMode, string> = {
  SIMULATION: "Simulation",
  TEST: "Test",
  CLIENT: "Client",
};

/**
 * Libellé précis d'un événement combinant statut et mode d'acheminement, pour
 * l'historique : « Simulée », « Envoyée test », « Envoyée client », « Échouée ».
 *
 * `deliveryMode` peut être null pour les événements créés avant son ajout :
 * on retombe alors sur le seul libellé de statut.
 */
export function reminderEventLabel(
  status: ReminderEventStatus,
  deliveryMode?: ReminderDeliveryMode | null
): string {
  if (status === "SENT") {
    if (deliveryMode === "CLIENT") return "Envoyée client";
    if (deliveryMode === "TEST") return "Envoyée test";
    return "Envoyée";
  }
  if (status === "FAILED") {
    if (deliveryMode === "CLIENT") return "Échouée (client)";
    if (deliveryMode === "TEST") return "Échouée (test)";
    return "Échouée";
  }
  return reminderEventStatusLabels[status];
}

/** Libellé court d'une étape par décalage de jours : 7 → « J+7 ». */
export function stepOffsetLabel(offsetDays: number): string {
  return offsetDays >= 0 ? `J+${offsetDays}` : `J${offsetDays}`;
}
