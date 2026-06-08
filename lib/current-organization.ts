import { prisma } from "@/lib/prisma";
import {
  DEMO_ORG_ID,
  DEMO_ORG_NAME,
  DEMO_ORG_EMAIL,
} from "@/lib/constants";

/**
 * Helper TEMPORAIRE : retourne l'organisation courante.
 *
 * Pour l'instant, il renvoie toujours l'organisation de démonstration et la
 * crée si elle n'existe pas encore (upsert). Cela permet à l'app de fonctionner
 * même sans avoir lancé le seed.
 *
 * Sera remplacé par la résolution via la session utilisateur (Supabase Auth).
 *
 * À n'appeler que côté serveur (Server Components / Server Actions).
 */
export async function getCurrentOrganization() {
  return prisma.organization.upsert({
    where: { id: DEMO_ORG_ID },
    update: {},
    create: {
      id: DEMO_ORG_ID,
      name: DEMO_ORG_NAME,
      email: DEMO_ORG_EMAIL,
    },
  });
}
