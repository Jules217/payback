import type { Organization } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email/send-reminder-email";
import { eligibleSteps } from "@/lib/reminders/eligible-steps";
import { renderTemplate } from "@/lib/reminders/render-template";
import { reserveEmailQuota } from "@/lib/reminders/email-quota";

/** Seuil de récupération d'un event coincé en SENDING (crash en plein envoi). */
const SENDING_STALE_MS = 15 * 60 * 1000;

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

export type SendQueueOrgResult = {
  envoyés: number;
  échoués: number;
  /**
   * Events laissés en file faute de quota org atteint OU plafond de run atteint
   * (= file − ce qui a pu être réservé). Pour le monitoring, pas l'UI.
   */
  restants: number;
};

export type SendQueueForOrgOptions = {
  /**
   * Budget d'envoi maximal pour cet appel, imposé par l'appelant (plafond dur du
   * run de cron). Borne le nombre d'envois EN PLUS du quota org ; le reste de la
   * file part au run suivant.
   */
  maxToSend?: number;
};

/**
 * Envoie les ReminderEvent CLIENT en file d'une organisation.
 *
 * Variante de sendQueue() sans dépendance à la session Supabase ni revalidatePath
 * — utilisable depuis un cron Route Handler.
 * Respecte emailSendingEnabled : retourne { 0, 0 } si désactivé.
 *
 * Quota journalier + budget de run : on ne réserve (et n'envoie) que
 * min(file, budget de run, quota restant). Claim atomique par event pour éviter
 * qu'un autre run double l'envoi, et récupération des SENDING orphelins.
 */
export async function sendQueueForOrg(
  org: Organization,
  options?: SendQueueForOrgOptions
): Promise<SendQueueOrgResult> {
  if (!org.emailSendingEnabled) return { envoyés: 0, échoués: 0, restants: 0 };

  const now = new Date();
  const staleThreshold = new Date(now.getTime() - SENDING_STALE_MS);

  const events = await prisma.reminderEvent.findMany({
    where: {
      organizationId: org.id,
      deliveryMode: "CLIENT",
      OR: [
        { status: "SCHEDULED" },
        { status: "SENDING", sentAt: null, claimedAt: { lt: staleThreshold } },
      ],
    },
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

  if (events.length === 0) return { envoyés: 0, échoués: 0, restants: 0 };

  // On ne réserve que ce qu'on pourra réellement tenter d'envoyer dans ce run
  // (borné par le budget). Réserver plus gaspillerait du quota sur des events
  // qu'on laisse en file à cause du plafond de run.
  const wantToSend =
    options?.maxToSend != null
      ? Math.min(events.length, Math.max(0, options.maxToSend))
      : events.length;
  // Plafond de run épuisé : toute la file reste, faute de budget.
  if (wantToSend === 0) {
    return { envoyés: 0, échoués: 0, restants: events.length };
  }

  const reservation = await reserveEmailQuota(org, wantToSend);
  let toSend = reservation.allowed;

  // Laissés en file faute de quota org ou de plafond de run : ce que la
  // réservation n'a pas couvert (les events au-delà de `allowed` ne sont jamais
  // claimés). Les échecs d'envoi restent dans `allowed` → ils ne comptent pas ici.
  const restants = events.length - reservation.allowed;

  let envoyés = 0;
  let échoués = 0;

  for (const event of events) {
    if (toSend <= 0) break; // quota ou budget de run épuisé

    // Claim atomique (compare-and-set) : un autre run concurrent ne peut pas
    // envoyer le même event. count===0 → déjà pris, on saute sans consommer
    // notre budget.
    const claimed = await prisma.reminderEvent.updateMany({
      where: {
        id: event.id,
        OR: [
          { status: "SCHEDULED" },
          { status: "SENDING", sentAt: null, claimedAt: { lt: staleThreshold } },
        ],
      },
      data: { status: "SENDING", claimedAt: now, sentAt: null },
    });
    if (claimed.count === 0) continue;

    toSend--;

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

  return { envoyés, échoués, restants };
}
