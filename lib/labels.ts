import type {
  PreferredChannel,
  Language,
  ClientStatus,
  InvoiceStatus,
  ReminderChannel,
  ReminderTone,
  ReminderEventStatus,
} from "@/types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

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
  DRAFT: "outline",
  SENT: "secondary",
  PENDING: "secondary",
  OVERDUE: "destructive",
  PAID: "default",
  CANCELLED: "outline",
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
  GENTLE: "secondary",
  PROFESSIONAL: "outline",
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

/** Libellé court d'une étape par décalage de jours : 7 → « J+7 ». */
export function stepOffsetLabel(offsetDays: number): string {
  return offsetDays >= 0 ? `J+${offsetDays}` : `J${offsetDays}`;
}
