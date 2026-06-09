import "server-only";

import type {
  RenderClient,
  RenderInvoice,
  RenderOrganization,
} from "@/lib/reminders/render-template";
import { EmailConfigError, getResendClient } from "./resend";
import { getFromEmail } from "./config";

export type SendReminderEmailInput = {
  /** Destinataire réel de l'email (à cette étape : toujours l'adresse de test). */
  to: string;
  /** Sujet déjà rendu (variables interpolées). */
  subject: string;
  /** Corps déjà rendu (variables interpolées). */
  body: string;
  invoice: RenderInvoice;
  client: RenderClient;
  organization: RenderOrganization;
};

export type SendReminderEmailResult = {
  success: boolean;
  providerMessageId?: string;
  error?: string;
};

/** Échappe le HTML pour éviter toute injection dans le rendu minimal. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Version texte : corps rendu + signature simple. */
function buildText(input: SendReminderEmailInput): string {
  return `${input.body}\n\n—\n${input.organization.name}`;
}

/** Version HTML minimale : paragraphes + signature, sans design complexe. */
function buildHtml(input: SendReminderEmailInput): string {
  const paragraphs = input.body
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("\n");

  return [
    '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1a1a1a; line-height: 1.5;">',
    paragraphs,
    '<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />',
    `<p style="color: #6b7280;">${escapeHtml(input.organization.name)}</p>`,
    "</div>",
  ].join("\n");
}

/**
 * Envoie un email de relance via Resend.
 *
 * Ne lève jamais : toute erreur (configuration absente, échec API, exception)
 * est encapsulée dans `SendReminderEmailResult` pour que l'appelant journalise
 * un ReminderEvent FAILED proprement. Aucun secret n'est inclus dans `error`.
 */
export async function sendReminderEmail(
  input: SendReminderEmailInput
): Promise<SendReminderEmailResult> {
  const from = getFromEmail();
  if (!from) {
    return {
      success: false,
      error: "RESEND_FROM_EMAIL n'est pas configurée.",
    };
  }

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: buildText(input),
      html: buildHtml(input),
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, providerMessageId: data?.id };
  } catch (err) {
    if (err instanceof EmailConfigError) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur d'envoi inconnue.",
    };
  }
}
