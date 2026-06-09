"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  ShieldAlert,
} from "lucide-react";

import {
  updateEmailSettings,
  type SettingsFormState,
} from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type EmailSettingsDefaults = {
  emailSendingEnabled: boolean;
  emailFromName: string;
  emailReplyTo: string;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function EmailSettingsForm({
  defaults,
}: {
  defaults: EmailSettingsDefaults;
}) {
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(updateEmailSettings, { ok: false });

  // Contrôlé pour adapter l'avertissement en direct.
  const [enabled, setEnabled] = useState(defaults.emailSendingEnabled);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        state.ok ? (
          <div className="flex items-center gap-2 rounded-md border border-green-600/40 bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle2 className="size-4 shrink-0" />
            {state.message}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {state.message}
          </div>
        )
      ) : null}

      <div className="rounded-md border p-4">
        <div className="flex items-start gap-3">
          <input
            id="emailSendingEnabled"
            name="emailSendingEnabled"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-0.5 size-4 rounded border-input"
          />
          <div className="space-y-1">
            <Label htmlFor="emailSendingEnabled" className="text-sm font-medium">
              Activer l&apos;envoi réel aux clients
            </Label>
            <p className="text-xs text-muted-foreground">
              Autorise l&apos;envoi de relances vers l&apos;adresse email des
              clients, toujours après confirmation manuelle.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="emailFromName">Nom d&apos;expéditeur</Label>
          <Input
            id="emailFromName"
            name="emailFromName"
            defaultValue={defaults.emailFromName}
            placeholder="Payback"
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground">
            Affiché comme nom de l&apos;expéditeur. Laisser vide pour utiliser la
            valeur par défaut.
          </p>
          <FieldError messages={state.errors?.emailFromName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailReplyTo">Email de réponse (reply-to)</Label>
          <Input
            id="emailReplyTo"
            name="emailReplyTo"
            type="email"
            defaultValue={defaults.emailReplyTo}
            placeholder="contact@mondomaine.com"
          />
          <p className="text-xs text-muted-foreground">
            Adresse à laquelle les clients répondront. Facultatif.
          </p>
          <FieldError messages={state.errors?.emailReplyTo} />
        </div>
      </div>

      {/* Avertissement clair, adapté à l'état courant de la case. */}
      <div
        className={
          enabled
            ? "flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300"
            : "flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
        }
      >
        {enabled ? (
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        ) : (
          <Mail className="mt-0.5 size-4 shrink-0" />
        )}
        <span>
          Quand cette option est désactivée, Payback ne peut envoyer que des
          emails de test. Quand elle est activée, les relances peuvent être
          envoyées aux adresses email des clients après confirmation manuelle.
        </span>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
