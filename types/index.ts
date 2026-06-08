/**
 * Types métier principaux de Payback.
 *
 * Ces types sont volontairement indépendants de Prisma à ce stade :
 * ils décrivent le domaine et servent de contrat pour l'UI et l'API.
 * Lorsque la base de données sera branchée, ils pourront être alignés
 * sur (ou dérivés de) `@prisma/client`.
 */

export type ID = string;

// ── Énumérations partagées ────────────────────────────────────
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "OVERDUE"
  | "PAID"
  | "CANCELLED";

export type ReminderChannel = "EMAIL" | "SMS";

export type ReminderEventStatus =
  | "SCHEDULED"
  | "SENT"
  | "FAILED"
  | "CANCELLED";

// ── Entités ───────────────────────────────────────────────────

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
  email?: string | null;
  phone?: string | null;
  company?: string | null;
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
  createdAt: Date;
  updatedAt: Date;
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
}

export interface MessageTemplate {
  id: ID;
  organizationId: ID;
  name: string;
  subject?: string | null;
  body: string;
  channel: ReminderChannel;
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
  createdAt: Date;
}

// ── Types relationnels pratiques (vues enrichies) ─────────────
export interface InvoiceWithClient extends Invoice {
  client: Client;
}

export interface ClientWithInvoices extends Client {
  invoices: Invoice[];
}
