"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import {
  updateOrgName,
  type SettingsFormState,
} from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function OrgNameForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(updateOrgName, { ok: false });

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        state.ok ? (
          <div className="flex items-center gap-2 rounded-md border border-green-600/40 bg-green-50 px-3 py-2 text-sm text-green-700">
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

      <div className="space-y-2">
        <Label htmlFor="name">Nom de l&apos;organisation</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultName}
          placeholder="Mon organisation"
          maxLength={120}
          required
        />
        <FieldError messages={state.errors?.name} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
