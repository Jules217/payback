"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { clientFormSchema } from "@/lib/validations/client";
import { planLimits } from "@/lib/subscription";

export type ClientFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  /** Valeurs ressaisies, renvoyées en cas d'erreur pour repeupler le formulaire. */
  values?: Record<string, string>;
};

function readForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    preferredChannel: String(formData.get("preferredChannel") ?? "EMAIL"),
    language: String(formData.get("language") ?? "FR"),
    notes: String(formData.get("notes") ?? ""),
  };
}

/** Crée un client dans l'organisation courante. */
export async function createClient(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const raw = readForm(formData);
  const parsed = clientFormSchema.safeParse(raw);

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

  // Cap de création par plan (anti-abus). On compte tous les clients de l'org,
  // y compris archivés — le cap borne le volume total créé, pas seulement actifs.
  const maxClients = planLimits(org).maxClients;
  const clientCount = await prisma.client.count({
    where: { organizationId: org.id },
  });
  if (clientCount >= maxClients) {
    return {
      ok: false,
      message: `Limite de ${maxClients} clients atteinte sur votre plan. Passez au plan supérieur pour en ajouter davantage.`,
      values: raw,
    };
  }

  await prisma.client.create({
    data: {
      organizationId: org.id,
      name: data.name,
      companyName: data.companyName || null,
      email: data.email || null,
      phone: data.phone || null,
      preferredChannel: data.preferredChannel,
      language: data.language,
      notes: data.notes || null,
    },
  });

  revalidatePath("/clients");
  redirect("/clients");
}

/** Met à jour un client existant (scopé à l'organisation courante). */
export async function updateClient(
  clientId: string,
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const raw = readForm(formData);
  const parsed = clientFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Veuillez corriger les erreurs ci-dessous.",
      errors: parsed.error.flatten().fieldErrors,
      values: raw,
    };
  }

  const org = await getCurrentOrganization();
  const existing = await prisma.client.findFirst({
    where: { id: clientId, organizationId: org.id },
    select: { id: true },
  });

  if (!existing) {
    return { ok: false, message: "Client introuvable." };
  }

  const data = parsed.data;
  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: data.name,
      companyName: data.companyName || null,
      email: data.email || null,
      phone: data.phone || null,
      preferredChannel: data.preferredChannel,
      language: data.language,
      notes: data.notes || null,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

/** Archive un client (pas de suppression définitive). */
export async function archiveClient(clientId: string): Promise<void> {
  const org = await getCurrentOrganization();

  await prisma.client.updateMany({
    where: { id: clientId, organizationId: org.id },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect("/clients");
}
