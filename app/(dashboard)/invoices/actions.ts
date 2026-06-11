"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { invoiceFormSchema } from "@/lib/validations/invoice";
import { batchEnqueueForOrg } from "@/lib/reminders/batch-enqueue";
import { hasProFeatures, planLimits } from "@/lib/subscription";

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

  // Cap de création par plan (anti-abus). Compte toutes les factures de l'org
  // (tous statuts confondus) : le cap borne le volume total créé.
  const maxInvoices = planLimits(org).maxInvoices;
  const invoiceCount = await prisma.invoice.count({
    where: { organizationId: org.id },
  });
  if (invoiceCount >= maxInvoices) {
    return {
      ok: false,
      message: `Limite de ${maxInvoices} factures atteinte sur votre plan. Passez au plan supérieur pour en ajouter davantage.`,
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
  // Borne anti-abus : au plus 100 factures par lot, ids non vides.
  const parsed = z
    .array(z.string().min(1))
    .max(100, "Trop de factures sélectionnées (100 maximum).")
    .safeParse(invoiceIds);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.errors[0]?.message ?? "Sélection invalide.",
      ajoutées: 0,
      ignorées: 0,
    };
  }
  invoiceIds = parsed.data;

  if (invoiceIds.length === 0) {
    return { ok: true, message: "Aucune facture sélectionnée.", ajoutées: 0, ignorées: 0 };
  }

  const org = await getCurrentOrganization();

  if (!hasProFeatures(org)) {
    return {
      ok: false,
      message: "L'envoi groupé requiert un abonnement Pro actif.",
      ajoutées: 0,
      ignorées: 0,
    };
  }

  if (!org.emailSendingEnabled) {
    return {
      ok: false,
      message: "L'envoi réel aux clients est désactivé. Activez-le dans Paramètres → Envoi email.",
      ajoutées: 0,
      ignorées: 0,
    };
  }

  const { ajoutées, ignorées } = await batchEnqueueForOrg(org, invoiceIds);

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
