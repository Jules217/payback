"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { renderTemplate } from "@/lib/reminders/render-template";
import { canBeReminded, consumedOffsets } from "@/lib/reminders/eligible-steps";
import { sequenceFormSchema } from "@/lib/validations/sequence";

export type SequenceFormState = {
  ok: boolean;
  message?: string;
  values?: Record<string, string>;
};

/**
 * Simule une relance pour une facture à une étape donnée (J+N).
 *
 * Aucun email/SMS réel n'est envoyé : on rend le template et on enregistre un
 * ReminderEvent au statut SIMULATED, visible dans l'historique de la facture.
 */
export async function simulateReminderForInvoice(
  invoiceId: string,
  offsetDays: number
): Promise<void> {
  const org = await getCurrentOrganization();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: org.id },
    include: {
      client: true,
      reminderEvents: { select: { offsetDays: true, status: true } },
    },
  });

  // Facture absente, payée ou annulée → aucune relance possible.
  if (!invoice) return;
  if (!canBeReminded(invoice)) return;

  // Anti-doublon : une étape déjà simulée/envoyée ne se rejoue pas.
  if (consumedOffsets(invoice.reminderEvents).has(offsetDays)) return;

  // Étape ACTIVE correspondante dans la séquence active de l'organisation.
  // La simulation utilise toujours le template actuellement associé à l'étape.
  const step = await prisma.reminderStep.findFirst({
    where: {
      offsetDays,
      isActive: true,
      sequence: { organizationId: org.id, isActive: true },
    },
    include: { template: true },
  });
  if (!step) return;

  const { subject, body } = renderTemplate({
    subjectTemplate: step.template?.subject ?? "",
    bodyTemplate: step.template?.body ?? "",
    invoice,
    client: invoice.client,
    organization: org,
  });

  const now = new Date();
  await prisma.reminderEvent.create({
    data: {
      organizationId: org.id,
      invoiceId: invoice.id,
      channel: "EMAIL",
      status: "SIMULATED",
      scheduledAt: now,
      sentAt: now,
      offsetDays,
      messageSubject: subject,
      messageBody: body,
    },
  });

  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/reminders");
}

/**
 * Met à jour une séquence de relance et réconcilie ses étapes.
 *
 * Les étapes sont reçues sérialisées en JSON dans le champ `steps`. On valide
 * les garde-fous (délai ≥ 0, modèle obligatoire, pas deux étapes actives au
 * même délai), puis on crée/met à jour/supprime pour refléter le formulaire.
 *
 * Les ReminderEvent déjà simulés ne sont pas affectés : ils sont rattachés à la
 * facture via `offsetDays`, indépendamment des `ReminderStep`.
 */
export async function updateSequence(
  sequenceId: string,
  _prevState: SequenceFormState,
  formData: FormData
): Promise<SequenceFormState> {
  const name = String(formData.get("name") ?? "");
  const rawSteps = String(formData.get("steps") ?? "[]");

  let stepsInput: unknown;
  try {
    stepsInput = JSON.parse(rawSteps);
  } catch {
    return { ok: false, message: "Données d'étapes invalides." };
  }

  const parsed = sequenceFormSchema.safeParse({ name, steps: stepsInput });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.errors.map((e) => e.message).join(" "),
      values: { name },
    };
  }

  const org = await getCurrentOrganization();
  const sequence = await prisma.reminderSequence.findFirst({
    where: { id: sequenceId, organizationId: org.id },
    include: { steps: { select: { id: true } } },
  });
  if (!sequence) {
    return { ok: false, message: "Séquence introuvable." };
  }

  const data = parsed.data;

  // Tous les modèles référencés doivent appartenir à l'organisation.
  const templateIds = [...new Set(data.steps.map((s) => s.templateId))];
  const validTemplates = await prisma.messageTemplate.count({
    where: { id: { in: templateIds }, organizationId: org.id },
  });
  if (validTemplates !== templateIds.length) {
    return { ok: false, message: "Un modèle sélectionné est introuvable." };
  }

  // Réconciliation : suppression des étapes retirées, puis upsert des autres.
  const keptIds = data.steps
    .map((s) => s.id)
    .filter((id): id is string => Boolean(id));
  const toDelete = sequence.steps
    .map((s) => s.id)
    .filter((id) => !keptIds.includes(id));

  const ordered = [...data.steps].sort((a, b) => a.offsetDays - b.offsetDays);

  await prisma.$transaction([
    ...(toDelete.length
      ? [prisma.reminderStep.deleteMany({ where: { id: { in: toDelete } } })]
      : []),
    ...ordered.map((step, index) => {
      const base = {
        offsetDays: step.offsetDays,
        channel: step.channel,
        templateId: step.templateId,
        isActive: step.isActive,
        order: index,
      };
      return step.id
        ? prisma.reminderStep.update({ where: { id: step.id }, data: base })
        : prisma.reminderStep.create({
            data: { sequenceId, ...base },
          });
    }),
    prisma.reminderSequence.update({
      where: { id: sequenceId },
      data: { name: data.name },
    }),
  ]);

  revalidatePath("/reminders");
  revalidatePath(`/reminders/${sequenceId}`);
  redirect(`/reminders/${sequenceId}`);
}
