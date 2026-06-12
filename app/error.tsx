"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Error boundary global (rendu à l'intérieur du root layout, polices appliquées).
 * Volontairement muet sur la cause : ni stack, ni message technique, ni log —
 * l'utilisateur n'a besoin que d'une issue calme (réessayer / revenir).
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TriangleAlert className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-medium tracking-tight">
            Une erreur est survenue de notre côté.
          </h1>
          <p className="text-sm text-muted-foreground">
            Rien n&apos;est perdu. Réessayez dans un instant ; si le problème
            persiste, revenez au tableau de bord.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()}>Réessayer</Button>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
