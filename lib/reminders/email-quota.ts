import type { Organization } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, planLimits } from "@/lib/subscription";

export type QuotaReservation = {
  /** Nombre d'envois effectivement autorisés et réservés (≤ requested). */
  allowed: number;
  /** Quota restant pour le jour APRÈS cette réservation. */
  remaining: number;
};

/**
 * Plafond dur d'emails réels envoyés par run de cron, toutes organisations
 * confondues — indépendant du quota par org. Protège du timeout Vercel et borne
 * le débit global : un run n'enverra jamais plus de ce nombre, le reste de la
 * file part au run suivant.
 */
export const MAX_EMAILS_PER_CRON_RUN = 200;

/**
 * Message affiché quand le quota journalier d'envois réels est atteint, adapté
 * au plan : un Starter est invité à passer au plan Pro (avec son quota), un Pro
 * n'a pas d'upgrade à proposer — on l'invite simplement à réessayer demain.
 */
export function quotaReachedMessage(org: Organization): string {
  const limit = planLimits(org).emailsPerDay;
  if (limit >= PLAN_LIMITS.PRO.emailsPerDay) {
    return `Quota d'envois quotidien atteint (${limit}/jour). Réessayez demain.`;
  }
  return `Quota d'envois quotidien atteint (${limit}/jour). Réessayez demain ou passez au plan Pro pour ${PLAN_LIMITS.PRO.emailsPerDay}/jour.`;
}

/** Minuit UTC du jour de `d` — clé (date, pas datetime) du compteur journalier. */
export function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Vérifie et RÉSERVE `requested` envois réels pour l'organisation, sur la
 * journée courante (UTC). Reset automatique du compteur quand on change de jour.
 *
 * ⚠️ La réservation est faite AVANT l'envoi. Si l'envoi échoue ensuite (Resend
 * indisponible), le quota reste consommé : c'est un choix délibéré. On préfère
 * sous-envoyer que dépasser le plafond — réserver après coup ouvrirait une
 * fenêtre de dépassement en cas de concurrence ou de crash post-envoi.
 *
 * Atomicité : un `SELECT … FOR UPDATE` verrouille la ligne Organization pour la
 * durée de la transaction. Deux réservations concurrentes se sérialisent — la
 * seconde attend le commit de la première puis relit la valeur fraîche, ce qui
 * élimine toute perte de mise à jour (lost update) sur le compteur.
 *
 * @returns allowed = min(requested, quota restant) ; remaining = quota restant
 *          après réservation. allowed peut être 0 si le plafond est atteint.
 */
export async function reserveEmailQuota(
  org: Organization,
  requested: number
): Promise<QuotaReservation> {
  const limit = planLimits(org).emailsPerDay;
  const today = utcDayStart(new Date());

  if (requested <= 0) {
    return { allowed: 0, remaining: limit };
  }

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      { emailsSentToday: number; emailsSentDate: Date | null }[]
    >`SELECT "emailsSentToday", "emailsSentDate"
        FROM "Organization"
       WHERE id = ${org.id}
       FOR UPDATE`;

    const row = rows[0];
    if (!row) return { allowed: 0, remaining: 0 };

    // Reset si on a changé de jour (comparaison sur la DATE UTC, pas le datetime).
    const sameDay =
      row.emailsSentDate != null &&
      utcDayStart(row.emailsSentDate).getTime() === today.getTime();
    const base = sameDay ? row.emailsSentToday : 0;

    const remainingBefore = Math.max(0, limit - base);
    const allowed = Math.min(requested, remainingBefore);

    await tx.organization.update({
      where: { id: org.id },
      data: { emailsSentToday: base + allowed, emailsSentDate: today },
    });

    return { allowed, remaining: remainingBefore - allowed };
  });
}
