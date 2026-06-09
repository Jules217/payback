import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Retourne l'organisation courante à partir de la session Supabase.
 *
 * Séquence :
 * 1. Lit l'utilisateur authentifié via supabase.auth.getUser().
 *    → redirect /login si aucune session valide.
 * 2. Trouve le User Prisma correspondant (supabaseId = user.id Supabase).
 *    → si absent : création à la volée (premier login).
 * 3. Trouve le premier Membership du User (orderBy createdAt asc).
 *    → redirect /login si aucun membership.
 * 4. Retourne membership.organization.
 *
 * Création à la volée (premier login) :
 * - User { supabaseId, email, name } + Organization { name: "Mon organisation" }
 *   + Membership { role: OWNER } créés en une transaction.
 * - Retourne la nouvelle Organization directement.
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

  // Trouve le User Prisma lié à ce compte Supabase.
  const prismaUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  if (!prismaUser) {
    // Premier login : crée User + Organization + Membership en une transaction.
    const org = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: { name: "Mon organisation" },
      });
      await tx.user.create({
        data: {
          supabaseId: user.id,
          email: user.email ?? "",
          name:
            (user.user_metadata?.full_name as string | undefined) ?? null,
          memberships: {
            create: {
              organizationId: newOrg.id,
              role: "OWNER",
            },
          },
        },
      });
      return newOrg;
    });
    return org;
  }

  // Trouve le premier Membership (le plus ancien) et retourne l'org.
  const membership = await prisma.membership.findFirst({
    where: { userId: prismaUser.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    redirect("/login");
  }

  return membership.organization;
}
