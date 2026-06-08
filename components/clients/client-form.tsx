"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import type { ClientFormState } from "@/app/(dashboard)/clients/actions";
import {
  PREFERRED_CHANNELS,
  LANGUAGES,
} from "@/lib/validations/client";
import { channelLabels, languageLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type ClientFormDefaults = {
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  preferredChannel?: string;
  language?: string;
  notes?: string;
};

type ClientFormAction = (
  state: ClientFormState,
  formData: FormData
) => Promise<ClientFormState>;

interface ClientFormProps {
  action: ClientFormAction;
  defaults?: ClientFormDefaults;
  submitLabel: string;
  cancelHref: string;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function ClientForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
}: ClientFormProps) {
  const [state, formAction, pending] = useActionState<
    ClientFormState,
    FormData
  >(action, { ok: false });

  // En cas d'erreur, on privilégie les valeurs ressaisies, sinon les valeurs initiales.
  const v = (field: keyof ClientFormDefaults) =>
    state.values?.[field] ?? defaults?.[field] ?? "";

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
            defaultValue={v("name")}
            placeholder="Jean Martin"
            required
          />
          <FieldError messages={state.errors?.name} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyName">Entreprise</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={v("companyName")}
            placeholder="Cabinet Martin"
          />
          <FieldError messages={state.errors?.companyName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={v("email")}
            placeholder="contact@exemple.com"
          />
          <FieldError messages={state.errors?.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={v("phone")}
            placeholder="+33 1 23 45 67 89"
          />
          <FieldError messages={state.errors?.phone} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredChannel">Canal préféré</Label>
          <Select
            id="preferredChannel"
            name="preferredChannel"
            defaultValue={v("preferredChannel") || "EMAIL"}
          >
            {PREFERRED_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {channelLabels[c]}
              </option>
            ))}
          </Select>
          <FieldError messages={state.errors?.preferredChannel} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Langue</Label>
          <Select
            id="language"
            name="language"
            defaultValue={v("language") || "FR"}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {languageLabels[l]}
              </option>
            ))}
          </Select>
          <FieldError messages={state.errors?.language} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={v("notes")}
            placeholder="Informations utiles sur ce client…"
            rows={4}
          />
          <FieldError messages={state.errors?.notes} />
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
