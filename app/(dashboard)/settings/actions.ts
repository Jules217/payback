"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { createClient } from "@/lib/supabase/server";
import { emailSettingsSchema, orgNameSchema } from "@/lib/validations/settings";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";

export type SettingsFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Crée un checkout Lemon Squeezy pour le plan donné et redirige vers la page de paiement.
 * Si la création échoue (env vars absentes, erreur API), renvoie un état d'erreur.
 */
export async function startCheckout(
  plan: "STARTER" | "PRO"
): Promise<SettingsFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const org = await getCurrentOrganization();

  const variantId =
    plan === "PRO"
      ? process.env.LEMONSQUEEZY_VARIANT_PRO
      : process.env.LEMONSQUEEZY_VARIANT_STARTER;

  if (!variantId) {
    return { ok: false, message: "Plan non configuré. Contactez le support." };
  }

  let url: string;
  try {
    url = await getCheckoutUrl({ variantId, email: user.email, orgId: org.id });
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof Error
          ? e.message
          : "Erreur lors de la création du checkout.",
    };
  }

  redirect(url);
}

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
  // L'argument vient du client : on valide qu'il s'agit bien d'un booléen.
  const parsed = z.boolean().safeParse(enabled);
  if (!parsed.success) {
    return { ok: false, message: "Valeur invalide." };
  }
  enabled = parsed.data;

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
