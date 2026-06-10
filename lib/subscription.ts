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
