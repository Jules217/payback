"use client";

import { useActionState, useState } from "react";
import { Send, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SendQueueResult } from "@/app/(dashboard)/reminders/actions";

interface SendQueueButtonProps {
  action: (
    prevState: SendQueueResult | null,
    formData: FormData
  ) => Promise<SendQueueResult>;
  count: number;
}

export function SendQueueButton({ action, count }: SendQueueButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<
    SendQueueResult | null,
    FormData
  >(action, null);

  // Résultat de l'envoi précédent — affiché après que la page s'est re-rendue.
  if (state !== null && !pending) {
    return (
      <div className="space-y-1 text-right">
        <p
          className={cn(
            "flex items-center justify-end gap-1.5 text-sm font-medium",
            state.ok ? "text-success" : "text-destructive"
          )}
        >
          {state.ok ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <XCircle className="size-4 shrink-0" />
          )}
          {state.message}
        </p>
        {state.échoués > 0 ? (
          <p className="text-[11px] text-destructive">
            {state.échoués} envoi{state.échoués > 1 ? "s" : ""} échoué
            {state.échoués > 1 ? "s" : ""} — vérifiez l&apos;historique des
            factures.
          </p>
        ) : null}
      </div>
    );
  }

  if (pending) {
    return (
      <Button size="sm" disabled className="gap-2">
        <Send className="size-4 animate-pulse" />
        Envoi en cours…
      </Button>
    );
  }

  if (confirming) {
    return (
      <form
        action={formAction}
        className="flex items-center gap-2"
        onSubmit={() => setConfirming(false)}
      >
        <Button type="submit" size="sm" className="gap-2">
          <Send className="size-4" />
          Confirmer l&apos;envoi
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
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className="gap-2"
      disabled={count === 0}
      onClick={() => setConfirming(true)}
    >
      <Send className="size-4" />
      Envoyer la file ({count})
    </Button>
  );
}
