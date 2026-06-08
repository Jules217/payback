import type {
  PreferredChannel,
  Language,
  ClientStatus,
  InvoiceStatus,
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
  PENDING: "En attente",
  OVERDUE: "En retard",
  PAID: "Payée",
  CANCELLED: "Annulée",
};

export const invoiceStatusVariants: Record<InvoiceStatus, BadgeVariant> = {
  DRAFT: "outline",
  PENDING: "secondary",
  OVERDUE: "destructive",
  PAID: "default",
  CANCELLED: "outline",
};
