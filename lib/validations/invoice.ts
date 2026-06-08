import { z } from "zod";

export const INVOICE_STATUSES = [
  "DRAFT",
  "SENT",
  "PENDING",
  "OVERDUE",
  "PAID",
  "CANCELLED",
] as const;

export const CURRENCIES = ["CAD", "USD", "EUR"] as const;

/**
 * Schéma de validation du formulaire facture.
 *
 * - `clientId` requis (existence vérifiée côté serveur dans l'action)
 * - `number` requis (numéro de facture)
 * - `amount` saisi en dollars/euros, converti en centimes côté action ; doit être > 0
 * - `currency` contrôlé, par défaut CAD
 * - `issuedAt` / `dueAt` requis ; l'échéance doit être ≥ l'émission
 * - `paymentUrl` optionnel mais URL valide si présent
 * - `description` optionnelle
 */
export const invoiceFormSchema = z
  .object({
    clientId: z.string().trim().min(1, "Le client est requis"),
    number: z
      .string()
      .trim()
      .min(1, "Le numéro de facture est requis")
      .max(60),
    amount: z.coerce
      .number({ invalid_type_error: "Montant invalide" })
      .positive("Le montant doit être supérieur à 0"),
    currency: z.enum(CURRENCIES, {
      errorMap: () => ({ message: "Devise invalide" }),
    }),
    issuedAt: z.string().trim().min(1, "La date d'émission est requise"),
    dueAt: z.string().trim().min(1, "La date d'échéance est requise"),
    status: z.enum(INVOICE_STATUSES, {
      errorMap: () => ({ message: "Statut invalide" }),
    }),
    paymentUrl: z
      .string()
      .trim()
      .url("URL de paiement invalide")
      .optional()
      .or(z.literal("")),
    description: z.string().trim().max(2000).optional(),
  })
  .refine((d) => new Date(d.dueAt) >= new Date(d.issuedAt), {
    message: "L'échéance doit être postérieure ou égale à l'émission",
    path: ["dueAt"],
  });

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
