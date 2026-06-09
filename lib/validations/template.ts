import { z } from "zod";

export const REMINDER_CHANNELS = ["EMAIL", "SMS"] as const;
export const REMINDER_TONES = ["GENTLE", "PROFESSIONAL", "FIRM"] as const;
export const TEMPLATE_LANGUAGES = ["FR", "EN"] as const;

/**
 * Schéma de validation du formulaire de modèle de message.
 *
 * - `name`, `channel`, `tone`, `language`, `body` requis
 * - `subject` requis uniquement pour le canal EMAIL
 * - les variables `{{...}}` sont autorisées (aucune validation de contenu) :
 *   les variables inconnues ne bloquent pas, elles sont juste ignorées au rendu
 */
export const templateFormSchema = z
  .object({
    name: z.string().trim().min(1, "Le nom est requis").max(120),
    channel: z.enum(REMINDER_CHANNELS, {
      errorMap: () => ({ message: "Canal invalide" }),
    }),
    tone: z.enum(REMINDER_TONES, {
      errorMap: () => ({ message: "Ton invalide" }),
    }),
    language: z.enum(TEMPLATE_LANGUAGES, {
      errorMap: () => ({ message: "Langue invalide" }),
    }),
    subject: z.string().trim().max(200).optional().or(z.literal("")),
    body: z.string().trim().min(1, "Le corps du message est requis").max(5000),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "EMAIL" && !data.subject?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le sujet est requis pour un email.",
        path: ["subject"],
      });
    }
  });

export type TemplateFormValues = z.infer<typeof templateFormSchema>;
