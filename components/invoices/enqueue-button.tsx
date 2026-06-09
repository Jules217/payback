"use client";

import { useActionState } from "react";
import { ListPlus, Clock, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EnqueueState } from "@/app/(dashboard)/reminders/actions";

interface EnqueueButtonProps {
  action: (prevState: EnqueueState, formData: FormData) => Promise<EnqueueState>;
  stepLabel: string;
}

export function EnqueueButton({ action }: EnqueueButtonProps) {
  const [state, formAction, pending] = useActionState<EnqueueState, FormData>(
    action,
    { ok: false }
  );

  return (
    <form action={formAction}>
      <div className="flex flex-col items-end gap-1">
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="gap-2"
          disabled={pending || state.ok}
        >
          {pending ? (
            <Clock className="size-4 animate-pulse" />
          ) : state.ok ? (
            <CheckCircle2 className="size-4 text-success" />
          ) : (
            <ListPlus className="size-4" />
          )}
          {pending ? "Mise en file…" : state.ok ? "En file" : "Ajouter à la file"}
        </Button>
        {state.message && state.ok ? (
          <p className="flex items-center gap-1 text-right text-[11px] text-success">
            <CheckCircle2 className="size-3.5 shrink-0" />
            {state.message}
          </p>
        ) : state.message && !state.ok ? (
          <p className="flex items-center gap-1 text-right text-[11px] text-destructive">
            <XCircle className="size-3.5 shrink-0" />
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
