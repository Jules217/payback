"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type RegisterState = {
  ok: boolean;
  message?: string;
};

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères."),
  email: z.string().email("Adresse email invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères."),
});

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { ok: false, message: first ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  // Si la confirmation email est activée sur le projet Supabase, session = null.
  if (!data.session) {
    return {
      ok: true,
      message:
        "Un email de confirmation a été envoyé. Vérifiez votre boîte mail pour activer votre compte.",
    };
  }

  redirect("/dashboard");
}
