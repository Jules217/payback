"use client";

import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";

import { startCheckout } from "@/app/(dashboard)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SubscriptionStatus = "INACTIVE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED";
type SubscriptionPlan = "STARTER" | "PRO" | null;

type Props = {
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  endsAt: string | null;
  label: string;
  hasActive: boolean;
};

function statusVariant(
  status: SubscriptionStatus
): "success" | "warning" | "secondary" {
  if (status === "ACTIVE" || status === "TRIALING") return "success";
  if (status === "PAST_DUE") return "warning";
  return "secondary";
}

export function SubscriptionCard({
  status,
  plan,
  endsAt,
  label,
  hasActive,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCheckout(selectedPlan: "STARTER" | "PRO") {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout(selectedPlan);
      if (result && !result.ok) setError(result.message ?? "Erreur inconnue.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant={statusVariant(status)}>{label}</Badge>
        {plan && hasActive && (
          <span className="text-sm text-muted-foreground">
            Plan {plan === "PRO" ? "Pro" : "Starter"}
          </span>
        )}
      </div>

      {endsAt && (status === "CANCELLED" || status === "PAST_DUE") && (
        <p className="text-sm text-muted-foreground">
          Accès jusqu&apos;au{" "}
          {new Date(endsAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      )}

      {hasActive ? (
        <a
          href="https://app.lemonsqueezy.com/my-orders"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Gérer mon abonnement <ExternalLink className="size-3" />
        </a>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleCheckout("STARTER")}
          >
            {isPending ? "Redirection…" : "Starter — 19 $/mois"}
          </Button>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => handleCheckout("PRO")}
          >
            {isPending ? "Redirection…" : "Pro — 49 $/mois"}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
