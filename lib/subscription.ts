import type { Organization } from "@prisma/client";

export function hasActiveSubscription(org: Organization): boolean {
  if (org.subscriptionStatus === "TRIALING") return true;
  if (org.subscriptionStatus === "ACTIVE") return true;
  if (
    org.subscriptionStatus === "CANCELLED" &&
    org.subscriptionEndsAt != null &&
    org.subscriptionEndsAt > new Date()
  )
    return true;
  return false;
}

// ── Limites de volume par plan (Bloc 4 anti-abus) ─────────────────
export const PLAN_LIMITS = {
  STARTER: { emailsPerDay: 50, maxClients: 50, maxInvoices: 200 },
  PRO:     { emailsPerDay: 500, maxClients: 1000, maxInvoices: 5000 },
  // Org sans plan actif (INACTIVE/TRIALING sans plan) = limites Starter
  DEFAULT: { emailsPerDay: 50, maxClients: 50, maxInvoices: 200 },
} as const;

export type PlanLimits = (typeof PLAN_LIMITS)[keyof typeof PLAN_LIMITS];

export function planLimits(org: Organization): PlanLimits {
  if (org.subscriptionPlan === "PRO" && hasActiveSubscription(org))
    return PLAN_LIMITS.PRO;
  return PLAN_LIMITS.STARTER;
}

export function hasProFeatures(org: Organization): boolean {
  if (!hasActiveSubscription(org)) return false;
  return org.subscriptionPlan === "PRO";
}

export function subscriptionLabel(org: Organization): string {
  switch (org.subscriptionStatus) {
    case "TRIALING":
      return "Essai gratuit";
    case "ACTIVE":
      return org.subscriptionPlan === "PRO" ? "Pro" : "Starter";
    case "CANCELLED":
      return "Annulé";
    case "PAST_DUE":
      return "Paiement en échec";
    default:
      return "Inactif";
  }
}
