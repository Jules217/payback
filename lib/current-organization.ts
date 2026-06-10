import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Retourne l'organisation courante à partir de la session Supabase.
 *
 * Séquence :
 * 1. Lit l'utilisateur authentifié via supabase.auth.getUser().
 *    → redirect /login si aucune session valide.
 * 2. Trouve le User Prisma par supabaseId.
 *    → si absent : upsert par email (crée ou rattache un user orphelin).
 * 3. Trouve le premier Membership du User (orderBy createdAt asc).
 *    → si absent : premier login réel → crée Organization + Membership en transaction.
 * 4. Retourne membership.organization.
 *
 * La signature de retour reste Promise<Organization> — les appelants ne changent pas.
 * À n'appeler que côté serveur (Server Components / Server Actions).
 */
export async function getCurrentOrganization() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Trouve le User Prisma par supabaseId ; si absent, upsert par email.
  // Protège contre P2002 quand un User existe déjà avec cet email sans supabaseId.
  const prismaUser =
    (await prisma.user.findUnique({ where: { supabaseId: user.id } })) ??
    (await prisma.user.upsert({
      where: { email: user.email! },
      update: { supabaseId: user.id },
      create: {
        email: user.email!,
        name: (user.user_metadata?.full_name as string | undefined) ?? null,
        supabaseId: user.id,
      },
    }));

  // Trouve le premier Membership (le plus ancien) et retourne l'org.
  const membership = await prisma.membership.findFirst({
    where: { userId: prismaUser.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    // Premier login réel : aucun Membership → crée Organization + Membership.
    const org = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: { name: "Mon organisation" },
      });
      await tx.membership.create({
        data: {
          userId: prismaUser.id,
          organizationId: newOrg.id,
          role: "OWNER",
        },
      });
      return newOrg;
    });
    return org;
  }

  return membership.organization;
}
