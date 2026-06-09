/**
 * Types métier principaux de Payback.
 *
 * Indépendants de Prisma : ils décrivent le domaine et servent de contrat
 * pour l'UI et l'API. Les littéraux d'enum sont alignés sur le schéma Prisma.
 */

export type ID = string;

// ── Énumérations partagées ────────────────────────────────────
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

export type PreferredChannel = "EMAIL" | "SMS" | "BOTH";

export type Language = "FR" | "EN";

export type ClientStatus = "ACTIVE" | "ARCHIVED";

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PENDING"
  | "OVERDUE"
  | "PAID"
  | "CANCELLED";

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CARD"
  | "CHECK"
  | "OTHER";

export type ReminderChannel = "EMAIL" | "SMS";

export type ReminderTone = "GENTLE" | "PROFESSIONAL" | "FIRM";

export type ReminderEventStatus =
  | "SCHEDULED"
  | "SIMULATED"
  | "SENT"
  | "FAILED"
  | "CANCELLED";

// ── Entités ───────────────────────────────────────────────────

export interface User {
  id: ID;
  email: string;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: ID;
  name: string;
  email?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: ID;
  organizationId: ID;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  preferredChannel: PreferredChannel;
  language: Language;
  status: ClientStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: ID;
  organizationId: ID;
  clientId: ID;
  number: string;
  /** Montant en centimes pour éviter les erreurs de virgule flottante. */
  amountCents: number;
  currency: string;
  issuedAt: Date;
  dueAt: Date;
  status: InvoiceStatus;
  paymentUrl?: string | null;
  description?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: ID;
  organizationId: ID;
  invoiceId: ID;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  paidAt: Date;
  note?: string | null;
  createdAt: Date;
}

export interface ReminderSequence {
  id: ID;
  organizationId: ID;
  name: string;
  isActive: boolean;
  steps: ReminderStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderStep {
  id: ID;
  sequenceId: ID;
  templateId?: ID | null;
  /** Décalage en jours / échéance (négatif = avant, positif = après). */
  offsetDays: number;
  channel: ReminderChannel;
  order: number;
  isActive: boolean;
}

export interface MessageTemplate {
  id: ID;
  organizationId: ID;
  name: string;
  subject?: string | null;
  body: string;
  channel: ReminderChannel;
  tone: ReminderTone;
  language: Language;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderEvent {
  id: ID;
  organizationId: ID;
  invoiceId: ID;
  channel: ReminderChannel;
  status: ReminderEventStatus;
  scheduledAt: Date;
  sentAt?: Date | null;
  offsetDays?: number | null;
  messageSubject?: string | null;
  messageBody?: string | null;
  /** Identifiant du message côté fournisseur (Resend) en cas de succès. */
  providerMessageId?: string | null;
  /** Message d'erreur en cas d'échec d'envoi (status FAILED). */
  errorMessage?: string | null;
  createdAt: Date;
}

// ── Types relationnels pratiques (vues enrichies) ─────────────
export interface InvoiceWithClient extends Invoice {
  client: Client;
}

export interface ClientWithInvoices extends Client {
  invoices: Invoice[];
}
