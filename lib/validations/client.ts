import { z } from "zod";

export const PREFERRED_CHANNELS = ["EMAIL", "SMS", "BOTH"] as const;
export const LANGUAGES = ["FR", "EN"] as const;

/**
 * Schéma de validation du formulaire client.
 *
 * - `name` requis
 * - `email` optionnel mais valide si présent (la chaîne vide est tolérée)
 * - `phone` optionnel
 * - `preferredChannel` contrôlé : EMAIL | SMS | BOTH
 * - `language` contrôlé : FR | EN
 */
export const clientFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(120),
  companyName: z.string().trim().max(160).optional(),
  email: z
    .string()
    .trim()
    .email("Adresse email invalide")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  preferredChannel: z.enum(PREFERRED_CHANNELS, {
    errorMap: () => ({ message: "Canal préféré invalide" }),
  }),
  language: z.enum(LANGUAGES, {
    errorMap: () => ({ message: "Langue invalide" }),
  }),
  notes: z.string().trim().max(2000).optional(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
