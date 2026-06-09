"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DequeueState } from "@/app/(dashboard)/reminders/actions";

interface DequeueButtonProps {
  action: (prevState: DequeueState, formData: FormData) => Promise<DequeueState>;
}

export function DequeueButton({ action }: DequeueButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<DequeueState, FormData>(
    action,
    { ok: false }
  );

  if (state.ok) return null;

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirming(true)}
          disabled={pending}
        >
          <Trash2 className="size-3.5" />
          Retirer
        </Button>
        {state.message ? (
          <p className="text-[11px] text-destructive">{state.message}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <Button
        type="submit"
        size="sm"
        variant="destructive"
        disabled={pending}
      >
        {pending ? "…" : "Confirmer"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Annuler
      </Button>
    </form>
  );
}
