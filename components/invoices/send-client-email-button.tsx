"use client";

import { useActionState, useState } from "react";
import {
  Send,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CheckCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SendClientState } from "@/app/(dashboard)/reminders/actions";

interface SendClientEmailButtonProps {
  action: (
    prevState: SendClientState,
    formData: FormData
  ) => Promise<SendClientState>;
  /** Opt-in d'envoi réel de l'organisation. */
  emailSendingEnabled: boolean;
  /** Email du client (null si absent). */
  clientEmail: string | null;
  clientName: string;
  invoiceNumber: string;
  amountLabel: string;
  stepLabel: string;
  /** Sujet rendu, affiché dans le récapitulatif de confirmation. */
  subject: string;
  /** Vrai si un envoi client a déjà réussi pour cette étape (anti-doublon). */
  alreadySent: boolean;
}

export function SendClientEmailButton({
  action,
  emailSendingEnabled,
  clientEmail,
  clientName,
  invoiceNumber,
  amountLabel,
  stepLabel,
  subject,
  alreadySent,
}: SendClientEmailButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<SendClientState, FormData>(
    action,
    { ok: false }
  );

  // Envoi réel désactivé → bouton désactivé + invitation à l'activer.
  if (!emailSendingEnabled) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          disabled
        >
          <ShieldAlert className="size-4" />
          Envoyer au client
        </Button>
        <p className="text-right text-[11px] text-amber-700 dark:text-amber-400">
          Activez l&apos;envoi réel dans{" "}
          <a href="/settings" className="underline hover:no-underline">
            Paramètres → Envoi email
          </a>
          .
        </p>
      </div>
    );
  }

  // Pas d'email client → impossible.
  if (!clientEmail) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          disabled
        >
          <ShieldAlert className="size-4" />
          Envoyer au client
        </Button>
        <p className="text-right text-[11px] text-amber-700 dark:text-amber-400">
          Ce client n&apos;a pas d&apos;adresse email.
        </p>
      </div>
    );
  }

  // Déjà envoyé avec succès pour cette étape → anti-doublon.
  if (alreadySent) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          disabled
        >
          <CheckCheck className="size-4" />
          Envoyé au client
        </Button>
        <p className="text-right text-[11px] text-muted-foreground">
          Déjà envoyé au client pour {stepLabel}.
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
          className="gap-2"
          onClick={() => setConfirming(true)}
        >
          <Send className="size-4" />
          Envoyer au client
        </Button>
        {state.message ? <ResultLine state={state} /> : null}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 dark:border-red-700/50 dark:bg-red-950/30">
      <p className="flex items-start gap-1.5 text-xs font-semibold text-red-800 dark:text-red-300">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
        Cette action enverra un vrai email au client.
      </p>
      <dl className="space-y-0.5 text-xs text-red-900/90 dark:text-red-200/90">
        <Row label="Client" value={clientName} />
        <Row label="Email" value={clientEmail} strong />
        <Row label="Facture" value={invoiceNumber} />
        <Row label="Montant" value={amountLabel} />
        <Row label="Étape" value={stepLabel} />
        <Row label="Sujet" value={subject || "(sujet vide)"} />
      </dl>
      <form
        action={formAction}
        className="flex items-center gap-2"
        onSubmit={() => setConfirming(false)}
      >
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Envoi…" : "Confirmer l'envoi au client"}
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

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 opacity-80">{label}</dt>
      <dd className={strong ? "text-right font-semibold" : "text-right"}>
        {value}
      </dd>
    </div>
  );
}

function ResultLine({ state }: { state: SendClientState }) {
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
