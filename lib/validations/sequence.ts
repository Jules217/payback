import { z } from "zod";

import { REMINDER_CHANNELS } from "@/lib/validations/template";

/** Une étape de la séquence, telle que soumise par le formulaire d'édition. */
export const sequenceStepSchema = z.object({
  id: z.string().optional(),
  offsetDays: z.coerce
    .number({ invalid_type_error: "Le délai doit être un nombre" })
    .int("Le délai doit être un entier")
    .min(0, "Le délai ne peut pas être négatif")
    .max(365, "Le délai ne peut pas dépasser 365 jours"),
  channel: z.enum(REMINDER_CHANNELS, {
    errorMap: () => ({ message: "Canal invalide" }),
  }),
  templateId: z.string().min(1, "Chaque étape doit avoir un modèle"),
  isActive: z.boolean(),
});

/**
 * Schéma d'édition d'une séquence de relance.
 *
 * Garde-fous métier :
 * - délai ≥ 0 (pas de relance avant l'échéance ici),
 * - chaque étape référence un modèle,
 * - pas deux étapes ACTIVES avec le même délai.
 */
export const sequenceFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Le nom de la séquence est requis")
      .max(120),
    steps: z.array(sequenceStepSchema).max(20, "Une séquence ne peut pas dépasser 20 étapes"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<number>();
    data.steps.forEach((step, index) => {
      if (!step.isActive) return;
      if (seen.has(step.offsetDays)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Deux étapes actives ont le même délai (J+${step.offsetDays}). Chaque délai doit être unique.`,
          path: ["steps", index, "offsetDays"],
        });
      } else {
        seen.add(step.offsetDays);
      }
    });
  });

export type SequenceFormValues = z.infer<typeof sequenceFormSchema>;
export type SequenceStepValues = z.infer<typeof sequenceStepSchema>;
