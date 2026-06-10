import { z } from "zod";

/**
 * Schéma de validation des paramètres d'envoi email de l'organisation.
 *
 * - `emailSendingEnabled` : opt-in explicite pour l'envoi réel aux clients.
 * - `emailFromName` : facultatif (nom d'expéditeur affiché).
 * - `emailReplyTo` : facultatif, mais doit être un email valide s'il est fourni.
 *
 * Les champs texte vides sont acceptés (`""`) et seront normalisés en `null`
 * côté action.
 */
export const orgNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est requis.")
    .max(120, "120 caractères maximum."),
});
export type OrgNameValues = z.infer<typeof orgNameSchema>;

export const emailSettingsSchema = z.object({
  emailSendingEnabled: z.boolean(),
  emailFromName: z.string().trim().max(120).optional().or(z.literal("")),
  emailReplyTo: z
    .string()
    .trim()
    .email("Adresse reply-to invalide.")
    .optional()
    .or(z.literal("")),
});

export type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
