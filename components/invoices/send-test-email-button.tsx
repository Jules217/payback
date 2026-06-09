"use client";

import { useActionState, useState } from "react";
import {
  Mail,
  MailWarning,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SendTestState } from "@/app/(dashboard)/reminders/actions";

interface SendTestEmailButtonProps {
  action: (prevState: SendTestState, formData: FormData) => Promise<SendTestState>;
  /** Adresse de test configurée, ou null si RESEND_TEST_RECIPIENT est absente. */
  testRecipient: string | null;
  stepLabel: string;
}

export function SendTestEmailButton({
  action,
  testRecipient,
  stepLabel,
}: SendTestEmailButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<SendTestState, FormData>(
    action,
    { ok: false }
  );

  // RESEND_TEST_RECIPIENT non configuré → bouton désactivé + explication.
  if (!testRecipient) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button type="button" size="sm" variant="outline" className="gap-2" disabled>
          <MailWarning className="size-4" />
          Envoyer email test
        </Button>
        <p className="text-right text-[11px] text-amber-700 dark:text-amber-400">
          Configurez <code>RESEND_TEST_RECIPIENT</code> pour activer l&apos;envoi.
        </p>
      </div>
    );
  }

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => setConfirming(true)}
        >
          <Mail className="size-4" />
          Envoyer email test
        </Button>
        {state.message ? <ResultLine state={state} /> : null}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2 rounded-md border border-sky-300 bg-sky-50 px-3 py-2 dark:border-sky-700/50 dark:bg-sky-950/30">
      <p className="flex items-start gap-1.5 text-xs text-sky-800 dark:text-sky-300">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Envoi réel {stepLabel} vers la seule adresse de test{" "}
          <span className="font-semibold">{testRecipient}</span>.{" "}
          <span className="font-semibold">
            Aucun vrai client ne recevra ce message.
          </span>
        </span>
      </p>
      <form
        action={formAction}
        className="flex items-center gap-2"
        onSubmit={() => setConfirming(false)}
      >
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Envoi…" : "Confirmer l'envoi"}
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
    </div>
  );
}

function ResultLine({ state }: { state: SendTestState }) {
  return state.ok ? (
    <p className="flex items-center gap-1 text-right text-[11px] text-green-700 dark:text-green-400">
      <CheckCircle2 className="size-3.5 shrink-0" />
      {state.message}
    </p>
  ) : (
    <p className="flex items-center gap-1 text-right text-[11px] text-destructive">
      <XCircle className="size-3.5 shrink-0" />
      {state.message}
    </p>
  );
}
