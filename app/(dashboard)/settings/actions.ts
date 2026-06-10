"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { emailSettingsSchema, orgNameSchema } from "@/lib/validations/settings";

export type SettingsFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function updateOrgName(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  void _prevState;

  const parsed = orgNameSchema.safeParse({
    name: String(formData.get("name") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez les champs en erreur.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const org = await getCurrentOrganization();
  await prisma.organization.update({
    where: { id: org.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");

  return { ok: true, message: "Nom de l'organisation mis à jour." };
}

/**
 * Active ou désactive l'envoi automatique par le cron pour l'organisation courante.
 */
export async function updateAutoSend(
  enabled: boolean
): Promise<SettingsFormState> {
  const org = await getCurrentOrganization();
  await prisma.organization.update({
    where: { id: org.id },
    data: { autoSendEnabled: enabled },
  });
  revalidatePath("/settings");
  return {
    ok: true,
    message: enabled
      ? "Envoi automatique activé."
      : "Envoi automatique désactivé.",
  };
}

/**
 * Met à jour la configuration d'envoi email de l'organisation courante.
 *
 * C'est le seul point où `emailSendingEnabled` est activé : tant qu'il reste à
 * false, aucune relance ne peut partir vers `client.email`.
 */
export async function updateEmailSettings(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  void _prevState;

  // Une case décochée n'est pas envoyée : son absence vaut `false`.
  const enabledRaw = formData.get("emailSendingEnabled");
  const parsed = emailSettingsSchema.safeParse({
    emailSendingEnabled: enabledRaw === "on" || enabledRaw === "true",
    emailFromName: String(formData.get("emailFromName") ?? ""),
    emailReplyTo: String(formData.get("emailReplyTo") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez les champs en erreur.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const org = await getCurrentOrganization();
  await prisma.organization.update({
    where: { id: org.id },
    data: {
      emailSendingEnabled: parsed.data.emailSendingEnabled,
      emailFromName: parsed.data.emailFromName?.trim() || null,
      emailReplyTo: parsed.data.emailReplyTo?.trim() || null,
    },
  });

  revalidatePath("/settings");
  // Le bandeau du dashboard dépend de `emailSendingEnabled` : on rafraîchit le layout.
  revalidatePath("/", "layout");

  return {
    ok: true,
    message: parsed.data.emailSendingEnabled
      ? "Paramètres enregistrés — l'envoi réel aux clients est activé."
      : "Paramètres enregistrés — l'envoi réel aux clients est désactivé.",
  };
}
