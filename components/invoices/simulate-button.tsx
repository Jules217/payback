"use client";

import { useState } from "react";
import { Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimulateButtonProps {
  action: () => Promise<void>;
  stepLabel: string;
}

export function SimulateButton({ action, stepLabel }: SimulateButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-2"
        onClick={() => setConfirming(true)}
      >
        <Send className="size-4" />
        Simuler la relance
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700/50 dark:bg-amber-950/30">
      <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
        <AlertCircle className="size-3.5 shrink-0" />
        Créer un événement simulé {stepLabel} — aucun email ou SMS ne sera envoyé.
      </p>
      <form action={action} className="flex items-center gap-2">
        <Button type="submit" size="sm">
          Confirmer
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setConfirming(false)}
        >
          Annuler
        </Button>
      </form>
    </div>
  );
}
