"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { invoiceFormSchema } from "@/lib/validations/invoice";
import { eligibleSteps } from "@/lib/reminders/eligible-steps";
import { renderTemplate } from "@/lib/reminders/render-template";

export type BatchEnqueueResult = {
  ok: boolean;
  message: string;
  ajoutées: number;
  ignorées: number;
};

export type InvoiceFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  /** Valeurs ressaisies, renvoyées en cas d'erreur pour repeupler le formulaire. */
  values?: Record<string, string>;
};

function readForm(formData: FormData) {
  return {
    clientId: String(formData.get("clientId") ?? ""),
    number: String(formData.get("number") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? "CAD"),
    issuedAt: String(formData.get("issuedAt") ?? ""),
    dueAt: String(formData.get("dueAt") ?? ""),
    status: String(formData.get("status") ?? "DRAFT"),
    paymentUrl: String(formData.get("paymentUrl") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
}

/** Crée une facture dans l'organisation courante. */
export async function createInvoice(
  _prevState: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const raw = readForm(formData);
  const parsed = invoiceFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Veuillez corriger les erreurs ci-dessous.",
      errors: parsed.error.flatten().fieldErrors,
      values: raw,
    };
  }

  const org = await getCurrentOrganization();
  const data = parsed.data;

  // Le client doit appartenir à l'organisation courante.
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, organizationId: org.id },
    select: { id: true },
  });
  if (!client) {
    return {
      ok: false,
      message: "Client introuvable.",
      errors: { clientId: ["Client introuvable"] },
      values: raw,
    };
  }

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: data.clientId,
      number: data.number,
      amountCents: Math.round(data.amount * 100),
      currency: data.currency,
      issuedAt: new Date(data.issuedAt),
      dueAt: new Date(data.dueAt),
      status: data.status,
      paymentUrl: data.paymentUrl || null,
      description: data.description || null,
      paidAt: data.status === "PAID" ? new Date() : null,
    },
    select: { id: true },
  });

  revalidatePath("/invoices");
  revalidatePath(`/clients/${data.clientId}`);
  redirect(`/invoices/${invoice.id}`);
}

/** Met à jour une facture existante (scopée à l'organisation courante). */
export async function updateInvoice(
  invoiceId: string,
  _prevState: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const raw = readForm(formData);
  const parsed = invoiceFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Veuillez corriger les erreurs ci-dessous.",
      errors: parsed.error.flatten().fieldErrors,
      values: raw,
    };
  }

  const org = await getCurrentOrganization();
  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: org.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    return { ok: false, message: "Facture introuvable.", values: raw };
  }

  // Une facture payée ou annulée ne se modifie pas directement.
  if (existing.status === "PAID" || existing.status === "CANCELLED") {
    return {
      ok: false,
      message:
        "Cette facture est payée ou annulée et ne peut pas être modifiée.",
      values: raw,
    };
  }

  const data = parsed.data;

  // Le client doit appartenir à l'organisation courante.
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, organizationId: org.id },
    select: { id: true },
  });
  if (!client) {
    return {
      ok: false,
      message: "Client introuvable.",
      errors: { clientId: ["Client introuvable"] },
      values: raw,
    };
  }

  // Cohérence du paidAt avec le statut choisi : renseigné au passage en PAID,
  // effacé sinon.
  const paidAt = data.status === "PAID" ? new Date() : null;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      clientId: data.clientId,
      number: data.number,
      amountCents: Math.round(data.amount * 100),
      currency: data.currency,
      issuedAt: new Date(data.issuedAt),
      dueAt: new Date(data.dueAt),
      status: data.status,
      paymentUrl: data.paymentUrl || null,
      description: data.description || null,
      paidAt,
    },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/clients/${data.clientId}`);
  redirect(`/invoices/${invoiceId}`);
}

/** Marque une facture comme payée (renseigne paidAt). */
export async function markInvoiceAsPaid(invoiceId: string): Promise<void> {
  const org = await getCurrentOrganization();

  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: org.id },
    select: { id: true, status: true, clientId: true },
  });
  if (!existing || existing.status === "CANCELLED") return;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/clients/${existing.clientId}`);
  redirect(`/invoices/${invoiceId}`);
}

/** Annule une facture (pas de suppression définitive). */
export async function cancelInvoice(invoiceId: string): Promise<void> {
  const org = await getCurrentOrganization();

  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: org.id },
    select: { id: true, status: true, clientId: true },
  });
  if (!existing || existing.status === "PAID") return;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/clients/${existing.clientId}`);
  redirect(`/invoices/${invoiceId}`);
}

/**
 * Enfile la première étape éligible de chaque facture listée.
 * Les factures sans étape éligible, sans email client, ou dont
 * l'index uniq_reminder_active détecte un doublon sont silencieusement ignorées.
 * router.refresh() côté client prend en charge la revalidation.
 */
export async function batchEnqueueReminders(
  invoiceIds: string[]
): Promise<BatchEnqueueResult> {
  if (invoiceIds.length === 0) {
    return { ok: true, message: "Aucune facture sélectionnée.", ajoutées: 0, ignorées: 0 };
  }

  const org = await getCurrentOrganization();

  if (!org.emailSendingEnabled) {
    return {
      ok: false,
      message: "L'envoi réel aux clients est désactivé. Activez-le dans Paramètres → Envoi email.",
      ajoutées: 0,
      ignorées: 0,
    };
  }

  const invoices = await prisma.invoice.findMany({
    where: { id: { in: invoiceIds }, organizationId: org.id },
    include: {
      client: { select: { id: true, name: true, companyName: true, email: true } },
      reminderEvents: { select: { offsetDays: true, status: true, deliveryMode: true } },
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
    if (!clientEmail) { ignorées++; continue; }

    const eligible = eligibleSteps(invoice, activeSteps, invoice.reminderEvents);
    const step = eligible[0];
    if (!step || !step.template) { ignorées++; continue; }

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
      // Doublon détecté par uniq_reminder_active ou autre contrainte — skip silencieux.
      ignorées++;
    }
  }

  const msgAjoutées = `${ajoutées} relance${ajoutées > 1 ? "s" : ""} ajoutée${ajoutées > 1 ? "s" : ""} à la file.`;
  const msgIgnorées =
    ignorées > 0
      ? ` ${ignorées} ignorée${ignorées > 1 ? "s" : ""} (déjà en file ou aucune étape éligible).`
      : "";

  return {
    ok: true,
    message:
      ajoutées === 0
        ? `Aucune relance ajoutée. ${ignorées} ignorée${ignorées > 1 ? "s" : ""} (déjà en file ou aucune étape éligible).`
        : msgAjoutées + msgIgnorées,
    ajoutées,
    ignorées,
  };
}
