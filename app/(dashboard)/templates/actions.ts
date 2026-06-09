"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { templateFormSchema } from "@/lib/validations/template";

export type TemplateFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

function readForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    channel: String(formData.get("channel") ?? "EMAIL"),
    tone: String(formData.get("tone") ?? "PROFESSIONAL"),
    language: String(formData.get("language") ?? "FR"),
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
  };
}

/** Crée un modèle de message dans l'organisation courante. */
export async function createTemplate(
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const raw = readForm(formData);
  const parsed = templateFormSchema.safeParse(raw);

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

  const template = await prisma.messageTemplate.create({
    data: {
      organizationId: org.id,
      name: data.name,
      channel: data.channel,
      tone: data.tone,
      language: data.language,
      subject: data.channel === "EMAIL" ? data.subject || null : null,
      body: data.body,
    },
    select: { id: true },
  });

  revalidatePath("/templates");
  redirect(`/templates/${template.id}`);
}

/** Met à jour un modèle existant (scopé à l'organisation courante). */
export async function updateTemplate(
  templateId: string,
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const raw = readForm(formData);
  const parsed = templateFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Veuillez corriger les erreurs ci-dessous.",
      errors: parsed.error.flatten().fieldErrors,
      values: raw,
    };
  }

  const org = await getCurrentOrganization();
  const existing = await prisma.messageTemplate.findFirst({
    where: { id: templateId, organizationId: org.id },
    select: { id: true },
  });
  if (!existing) {
    return { ok: false, message: "Modèle introuvable.", values: raw };
  }

  const data = parsed.data;
  await prisma.messageTemplate.update({
    where: { id: templateId },
    data: {
      name: data.name,
      channel: data.channel,
      tone: data.tone,
      language: data.language,
      subject: data.channel === "EMAIL" ? data.subject || null : null,
      body: data.body,
    },
  });

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}`);
  revalidatePath("/reminders");
  redirect(`/templates/${templateId}`);
}

/**
 * Archive un modèle (désactivation logique, pas de suppression).
 * Un modèle reste lié à ses étapes : la séquence affichera une alerte si une
 * étape utilise un modèle archivé.
 */
export async function archiveTemplate(templateId: string): Promise<void> {
  const org = await getCurrentOrganization();

  await prisma.messageTemplate.updateMany({
    where: { id: templateId, organizationId: org.id },
    data: { isActive: false },
  });

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}`);
  revalidatePath("/reminders");
  redirect(`/templates/${templateId}`);
}

/** Réactive un modèle précédemment archivé. */
export async function restoreTemplate(templateId: string): Promise<void> {
  const org = await getCurrentOrganization();

  await prisma.messageTemplate.updateMany({
    where: { id: templateId, organizationId: org.id },
    data: { isActive: true },
  });

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}`);
  revalidatePath("/reminders");
  redirect(`/templates/${templateId}`);
}
