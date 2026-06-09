"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { renderTemplate } from "@/lib/reminders/render-template";
import { canBeReminded, consumedOffsets } from "@/lib/reminders/eligible-steps";
import { sequenceFormSchema } from "@/lib/validations/sequence";
import { sendReminderEmail } from "@/lib/email/send-reminder-email";
import { getTestRecipient } from "@/lib/email/config";
import { stepOffsetLabel } from "@/lib/labels";

export type SequenceFormState = {
  ok: boolean;
  message?: string;
  values?: Record<string, string>;
};

export type SendTestState = {
  ok: boolean;
  message?: string;
};

export type SendClientState = {
  ok: boolean;
  message?: string;
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
      // Aucun envoi : on mémorise le destinataire théorique pour l'historique.
      recipientEmail: invoice.client.email ?? null,
      deliveryMode: "SIMULATION",
    },
  });

  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/reminders");
}

/**
 * Envoie un email de RELANCE DE TEST pour une facture à une étape donnée.
 *
 * Sécurité de cette étape : l'email part UNIQUEMENT vers `RESEND_TEST_RECIPIENT`,
 * jamais vers `client.email`. Aucun vrai client n'est contacté.
 *
 * Anti-doublon : volontairement absent ici (contrairement à la simulation). On
 * veut pouvoir retester une étape même si une simulation/un envoi existe déjà.
 * Le garde-fou est la confirmation explicite dans l'UI avant chaque envoi.
 *
 * Journalise un ReminderEvent SENT (succès) ou FAILED (échec) avec le sujet, le
 * corps rendus, l'éventuel `providerMessageId` et le message d'erreur.
 */
export async function sendTestReminderForInvoice(
  invoiceId: string,
  offsetDays: number,
  _prevState: SendTestState,
  _formData: FormData
): Promise<SendTestState> {
  // Signature imposée par useActionState ; ces deux paramètres ne servent pas ici.
  void _prevState;
  void _formData;

  const org = await getCurrentOrganization();

  const testRecipient = getTestRecipient();
  if (!testRecipient) {
    return {
      ok: false,
      message:
        "RESEND_TEST_RECIPIENT n'est pas configuré — aucun email de test ne peut être envoyé.",
    };
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: org.id },
    include: { client: true },
  });
  if (!invoice) {
    return { ok: false, message: "Facture introuvable." };
  }

  // La facture ne doit être ni payée ni annulée.
  if (
    invoice.status === "PAID" ||
    invoice.status === "CANCELLED" ||
    invoice.paidAt
  ) {
    return {
      ok: false,
      message: "Facture payée ou annulée — relance impossible.",
    };
  }

  // Étape active correspondante dans la séquence active de l'organisation.
  const step = await prisma.reminderStep.findFirst({
    where: {
      offsetDays,
      isActive: true,
      sequence: { organizationId: org.id, isActive: true },
    },
    include: { template: true },
  });
  if (!step) {
    return { ok: false, message: "Étape de relance introuvable ou inactive." };
  }
  if (!step.template || !step.template.isActive) {
    return {
      ok: false,
      message: "Le modèle de cette étape est introuvable ou archivé.",
    };
  }

  const { subject, body } = renderTemplate({
    subjectTemplate: step.template.subject ?? "",
    bodyTemplate: step.template.body ?? "",
    invoice,
    client: invoice.client,
    organization: org,
  });

  // Envoi réel — uniquement vers l'adresse de test.
  const result = await sendReminderEmail({
    to: testRecipient,
    subject,
    body,
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
      status: result.success ? "SENT" : "FAILED",
      scheduledAt: now,
      sentAt: result.success ? now : null,
      offsetDays,
      messageSubject: subject,
      messageBody: body,
      providerMessageId: result.providerMessageId ?? null,
      errorMessage: result.success ? null : (result.error ?? "Erreur inconnue."),
      recipientEmail: testRecipient,
      deliveryMode: "TEST",
    },
  });

  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/reminders");

  return result.success
    ? { ok: true, message: `Email de test envoyé à ${testRecipient}.` }
    : {
        ok: false,
        message: `Échec de l'envoi : ${result.error ?? "erreur inconnue."}`,
      };
}

/**
 * Envoie une RELANCE RÉELLE au client (`client.email`) pour une étape donnée.
 *
 * Garde-fous (toute violation interrompt l'envoi, aucun email ne part) :
 * - `organization.emailSendingEnabled` doit être true (opt-in explicite) ;
 * - la facture appartient à l'organisation courante, n'est ni payée ni annulée ;
 * - le client possède une adresse email ;
 * - l'étape (offsetDays) est active et son modèle est actif ;
 * - anti-doublon : pas de second envoi CLIENT réussi pour le même offsetDays
 *   (un nouvel essai reste possible si le dernier envoi client a échoué).
 *
 * N'utilise JAMAIS `RESEND_TEST_RECIPIENT` : le destinataire est `client.email`.
 * Journalise un ReminderEvent SENT/FAILED en mode CLIENT.
 */
export async function sendClientReminderForInvoice(
  invoiceId: string,
  offsetDays: number,
  _prevState: SendClientState,
  _formData: FormData
): Promise<SendClientState> {
  void _prevState;
  void _formData;

  const org = await getCurrentOrganization();

  // Garde-fou principal : opt-in organisation. Sans lui, rien ne part au client.
  if (!org.emailSendingEnabled) {
    return {
      ok: false,
      message:
        "L'envoi réel aux clients est désactivé. Activez-le dans Paramètres → Envoi email.",
    };
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: org.id },
    include: {
      client: true,
      reminderEvents: {
        select: { offsetDays: true, status: true, deliveryMode: true },
      },
    },
  });
  if (!invoice) {
    return { ok: false, message: "Facture introuvable." };
  }

  // Ni payée ni annulée.
  if (
    invoice.status === "PAID" ||
    invoice.status === "CANCELLED" ||
    invoice.paidAt
  ) {
    return {
      ok: false,
      message: "Facture payée ou annulée — relance impossible.",
    };
  }

  const clientEmail = invoice.client.email?.trim();
  if (!clientEmail) {
    return {
      ok: false,
      message: "Le client n'a pas d'adresse email — envoi impossible.",
    };
  }

  // Anti-doublon CLIENT : un envoi client déjà réussi pour ce décalage bloque ;
  // un précédent échec (FAILED) n'empêche pas un nouvel essai.
  const alreadySentToClient = invoice.reminderEvents.some(
    (e) =>
      e.deliveryMode === "CLIENT" &&
      e.status === "SENT" &&
      e.offsetDays === offsetDays
  );
  if (alreadySentToClient) {
    return {
      ok: false,
      message: `Un email a déjà été envoyé au client pour l'étape ${stepOffsetLabel(offsetDays)}.`,
    };
  }

  // Étape active + modèle actif dans la séquence active de l'organisation.
  const step = await prisma.reminderStep.findFirst({
    where: {
      offsetDays,
      isActive: true,
      sequence: { organizationId: org.id, isActive: true },
    },
    include: { template: true },
  });
  if (!step) {
    return { ok: false, message: "Étape de relance introuvable ou inactive." };
  }
  if (!step.template || !step.template.isActive) {
    return {
      ok: false,
      message: "Le modèle de cette étape est introuvable ou archivé.",
    };
  }

  const { subject, body } = renderTemplate({
    subjectTemplate: step.template.subject ?? "",
    bodyTemplate: step.template.body ?? "",
    invoice,
    client: invoice.client,
    organization: org,
  });

  // Envoi réel vers le client (jamais l'adresse de test).
  const result = await sendReminderEmail({
    to: clientEmail,
    subject,
    body,
    invoice,
    client: invoice.client,
    organization: org,
    fromName: org.emailFromName,
    replyTo: org.emailReplyTo,
  });

  const now = new Date();
  await prisma.reminderEvent.create({
    data: {
      organizationId: org.id,
      invoiceId: invoice.id,
      channel: "EMAIL",
      status: result.success ? "SENT" : "FAILED",
      scheduledAt: now,
      sentAt: result.success ? now : null,
      offsetDays,
      messageSubject: subject,
      messageBody: body,
      providerMessageId: result.providerMessageId ?? null,
      errorMessage: result.success ? null : (result.error ?? "Erreur inconnue."),
      recipientEmail: clientEmail,
      deliveryMode: "CLIENT",
    },
  });

  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/reminders");

  return result.success
    ? { ok: true, message: `Email envoyé au client (${clientEmail}).` }
    : {
        ok: false,
        message: `Échec de l'envoi : ${result.error ?? "erreur inconnue."}`,
      };
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
