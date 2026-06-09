"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Copy, Check } from "lucide-react";

import type { TemplateFormState } from "@/app/(dashboard)/templates/actions";
import {
  REMINDER_CHANNELS,
  REMINDER_TONES,
  TEMPLATE_LANGUAGES,
} from "@/lib/validations/template";
import {
  reminderChannelLabels,
  reminderToneLabels,
  languageLabels,
} from "@/lib/labels";
import { SUPPORTED_VARIABLES, renderPreview } from "@/lib/reminders/preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type TemplateFormDefaults = {
  name?: string;
  channel?: string;
  tone?: string;
  language?: string;
  subject?: string;
  body?: string;
};

type TemplateFormAction = (
  state: TemplateFormState,
  formData: FormData
) => Promise<TemplateFormState>;

interface TemplateFormProps {
  action: TemplateFormAction;
  defaults?: TemplateFormDefaults;
  submitLabel: string;
  cancelHref: string;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

function VariableChip({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(token);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          // Presse-papiers indisponible : la variable reste copiable à la main.
        }
      }}
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-mono text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      title="Copier la variable"
    >
      {token}
      {copied ? (
        <Check className="size-3 text-primary" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
}

/** Clés des variables officiellement supportées. */
const KNOWN_KEYS = new Set(
  SUPPORTED_VARIABLES.map((v) => v.token.replace(/\{\{|\}\}/g, "").trim())
);

/** Retourne les tokens `{{…}}` non reconnus trouvés dans un texte. */
function unknownVarsIn(text: string): string[] {
  const results: string[] = [];
  const regex = /\{\{\s*([\w]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (!KNOWN_KEYS.has(match[1])) results.push(`{{${match[1]}}}`);
  }
  return results;
}

export function TemplateForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
}: TemplateFormProps) {
  const [state, formAction, pending] = useActionState<
    TemplateFormState,
    FormData
  >(action, { ok: false });

  // Valeurs contrôlées pour l'aperçu en direct.
  const initial = (field: keyof TemplateFormDefaults) =>
    state.values?.[field] ?? defaults?.[field] ?? "";

  const [channel, setChannel] = useState(initial("channel") || "EMAIL");
  const [subject, setSubject] = useState(initial("subject"));
  const [body, setBody] = useState(initial("body"));

  const preview = renderPreview(subject, body);
  const isEmail = channel === "EMAIL";

  // Variables inconnues (warning non bloquant)
  const unknownVars = [
    ...new Set([...unknownVarsIn(subject), ...unknownVarsIn(body)]),
  ];

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">
            Nom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={initial("name")}
            placeholder="Rappel doux"
            required
          />
          <FieldError messages={state.errors?.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="channel">
            Canal <span className="text-destructive">*</span>
          </Label>
          <Select
            id="channel"
            name="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            {REMINDER_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {reminderChannelLabels[c]}
              </option>
            ))}
          </Select>
          <FieldError messages={state.errors?.channel} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone">
            Ton <span className="text-destructive">*</span>
          </Label>
          <Select
            id="tone"
            name="tone"
            defaultValue={initial("tone") || "PROFESSIONAL"}
          >
            {REMINDER_TONES.map((t) => (
              <option key={t} value={t}>
                {reminderToneLabels[t]}
              </option>
            ))}
          </Select>
          <FieldError messages={state.errors?.tone} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">
            Langue <span className="text-destructive">*</span>
          </Label>
          <Select
            id="language"
            name="language"
            defaultValue={initial("language") || "FR"}
          >
            {TEMPLATE_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {languageLabels[l]}
              </option>
            ))}
          </Select>
          <FieldError messages={state.errors?.language} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="subject">
            Sujet{" "}
            {isEmail ? (
              <span className="text-destructive">*</span>
            ) : (
              <span className="text-xs text-muted-foreground">
                (ignoré pour le SMS)
              </span>
            )}
          </Label>
          <Input
            id="subject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Petit rappel : facture {{invoice_number}}"
          />
          <FieldError messages={state.errors?.subject} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="body">
            Corps du message <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="body"
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Bonjour {{client_name}}, …"
            rows={8}
          />
          <FieldError messages={state.errors?.body} />
        </div>
      </div>

      {unknownVars.length > 0 ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            Variable{unknownVars.length > 1 ? "s" : ""} inconnue
            {unknownVars.length > 1 ? "s" : ""} :{" "}
            {unknownVars.map((v, i) => (
              <span key={v}>
                <code className="rounded bg-amber-100 px-1 font-mono text-xs dark:bg-amber-900/50">
                  {v}
                </code>
                {i < unknownVars.length - 1 ? ", " : ""}
              </span>
            ))}
            . Elle{unknownVars.length > 1 ? "s seront" : " sera"} remplacée
            {unknownVars.length > 1 ? "s" : ""} par une chaîne vide.
          </span>
        </div>
      ) : null}

      <div className="rounded-md border bg-muted/30 p-4">
        <p className="text-sm font-medium">Variables disponibles</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Cliquez pour copier. Elles seront remplacées automatiquement lors de
          la simulation (les variables inconnues sont simplement ignorées).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUPPORTED_VARIABLES.map((v) => (
            <VariableChip key={v.token} token={v.token} />
          ))}
        </div>
      </div>

      <div className="rounded-md border p-4">
        <p className="text-sm font-medium">Aperçu</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Rendu avec des données de démonstration.
        </p>
        <div className="mt-3 space-y-2 rounded bg-muted/50 p-3 text-sm">
          {isEmail ? (
            <p className="font-medium">
              {preview.subject || (
                <span className="text-muted-foreground">
                  (sujet vide)
                </span>
              )}
            </p>
          ) : null}
          <p className="whitespace-pre-wrap text-muted-foreground">
            {preview.body || "(corps vide)"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
