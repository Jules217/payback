"use client";

import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Error boundary du dashboard : rendu DANS le layout (la sidebar et l'en-tête
 * restent en place), seule la zone de contenu est remplacée. Aucun détail
 * technique exposé ni journalisé.
 */
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TriangleAlert className="size-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-medium tracking-tight">
            Cette page n&apos;a pas pu se charger.
          </h2>
          <p className="text-sm text-muted-foreground">
            Réessayez dans un instant — vos données sont intactes.
          </p>
        </div>
        <Button onClick={() => reset()}>Réessayer</Button>
      </div>
    </div>
  );
}
