import type { Organization } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email/send-reminder-email";
import { eligibleSteps } from "@/lib/reminders/eligible-steps";
import { renderTemplate } from "@/lib/reminders/render-template";

export type BatchEnqueueOrgResult = {
  ajoutées: number;
  ignorées: number;
};

/**
 * Enfile la première étape éligible de chaque facture d'une organisation.
 *
 * - invoiceIds vide → traite toutes les factures de l'org (mode cron).
 * - invoiceIds non vide → traite uniquement les factures listées (mode UI batch).
 *
 * Ne vérifie pas emailSendingEnabled : c'est la responsabilité de l'appelant
 * (guard UI dans batchEnqueueReminders, absent volontairement pour le cron
 * qui alimente la file sans envoyer — l'envoi reste sous la garde de sendQueue).
 *
 * Les doublons détectés par l'index partiel uniq_reminder_active sont absorbés
 * silencieusement.
 */
export async function batchEnqueueForOrg(
  org: Organization,
  invoiceIds: string[]
): Promise<BatchEnqueueOrgResult> {
  const invoices = await prisma.invoice.findMany({
    where:
      invoiceIds.length > 0
        ? { id: { in: invoiceIds }, organizationId: org.id }
        : { organizationId: org.id },
    include: {
      client: {
        select: { id: true, name: true, companyName: true, email: true },
      },
      reminderEvents: {
        select: { offsetDays: true, status: true, deliveryMode: true },
      },
    },
  });

  const sequence = await prisma.reminderSequence.findFirst({
    where: { organizationId: org.id, isActive: true },
    include: {
      steps: {
        where: { isActive: true },
        include: { template: true },
        orderBy: { offsetDays: "asc" },
      },
    },
  });

  const activeSteps = sequence?.steps.filter((s) => s.template?.isActive) ?? [];

  let ajoutées = 0;
  let ignorées = 0;

  for (const invoice of invoices) {
    const clientEmail = invoice.client.email?.trim();
    if (!clientEmail) {
      ignorées++;
      continue;
    }

    const eligible = eligibleSteps(invoice, activeSteps, invoice.reminderEvents);
    const step = eligible[0];
    if (!step || !step.template) {
      ignorées++;
      continue;
    }

    const { subject, body } = renderTemplate({
      subjectTemplate: step.template.subject ?? "",
      bodyTemplate: step.template.body ?? "",
      invoice,
      client: invoice.client,
      organization: org,
    });

    try {
      await prisma.reminderEvent.create({
        data: {
          organizationId: org.id,
          invoiceId: invoice.id,
          channel: "EMAIL",
          status: "SCHEDULED",
          deliveryMode: "CLIENT",
          scheduledAt: new Date(),
          sentAt: null,
          offsetDays: step.offsetDays,
          messageSubject: subject,
          messageBody: body,
          recipientEmail: clientEmail,
        },
      });
      ajoutées++;
    } catch {
      // Doublon (uniq_reminder_active) ou autre contrainte — ignoré.
      ignorées++;
    }
  }

  return { ajoutées, ignorées };
}

export type SendQueueOrgResult = { envoyés: number; échoués: number };

/**
 * Envoie tous les ReminderEvent SCHEDULED/CLIENT d'une organisation.
 *
 * Variante de sendQueue() sans dépendance à la session Supabase ni revalidatePath
 * — utilisable depuis un cron Route Handler.
 * Respecte emailSendingEnabled : retourne { 0, 0 } si désactivé.
 */
export async function sendQueueForOrg(
  org: Organization
): Promise<SendQueueOrgResult> {
  if (!org.emailSendingEnabled) return { envoyés: 0, échoués: 0 };

  const events = await prisma.reminderEvent.findMany({
    where: { organizationId: org.id, status: "SCHEDULED", deliveryMode: "CLIENT" },
    orderBy: { scheduledAt: "asc" },
    include: {
      invoice: {
        select: {
          number: true,
          amountCents: true,
          currency: true,
          dueAt: true,
          paymentUrl: true,
          client: { select: { name: true, companyName: true } },
        },
      },
    },
  });

  let envoyés = 0;
  let échoués = 0;
  const now = new Date();

  for (const event of events) {
    if (!event.recipientEmail || !event.messageSubject || !event.messageBody) {
      await prisma.reminderEvent.update({
        where: { id: event.id },
        data: { status: "FAILED", errorMessage: "Snapshot manquant." },
      });
      échoués++;
      continue;
    }

    const result = await sendReminderEmail({
      to: event.recipientEmail,
      subject: event.messageSubject,
      body: event.messageBody,
      invoice: event.invoice,
      client: event.invoice.client,
      organization: org,
      fromName: org.emailFromName,
      replyTo: org.emailReplyTo,
    });

    if (result.success) {
      await prisma.reminderEvent.update({
        where: { id: event.id },
        data: {
          status: "SENT",
          sentAt: now,
          providerMessageId: result.providerMessageId ?? null,
        },
      });
      envoyés++;
    } else {
      await prisma.reminderEvent.update({
        where: { id: event.id },
        data: { status: "FAILED", errorMessage: result.error ?? "Erreur inconnue." },
      });
      échoués++;
    }
  }

  return { envoyés, échoués };
}
