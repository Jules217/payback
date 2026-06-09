"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Plus, Trash2 } from "lucide-react";

import type { SequenceFormState } from "@/app/(dashboard)/reminders/actions";
import { REMINDER_CHANNELS } from "@/lib/validations/template";
import { reminderChannelLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type SequenceFormTemplate = {
  id: string;
  name: string;
  isActive: boolean;
};

export type SequenceFormStep = {
  id?: string;
  offsetDays: string;
  channel: string;
  templateId: string;
  isActive: boolean;
};

type SequenceFormAction = (
  state: SequenceFormState,
  formData: FormData
) => Promise<SequenceFormState>;

interface SequenceFormProps {
  action: SequenceFormAction;
  defaultName: string;
  initialSteps: SequenceFormStep[];
  templates: SequenceFormTemplate[];
  cancelHref: string;
}

let rowSeq = 0;
function newRowKey() {
  rowSeq += 1;
  return `row-${rowSeq}`;
}

export function SequenceForm({
  action,
  defaultName,
  initialSteps,
  templates,
  cancelHref,
}: SequenceFormProps) {
  const [state, formAction, pending] = useActionState<
    SequenceFormState,
    FormData
  >(action, { ok: false });

  const [rows, setRows] = useState(
    initialSteps.map((s) => ({ key: newRowKey(), ...s }))
  );

  const updateRow = (key: string, patch: Partial<SequenceFormStep>) =>
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );

  const removeRow = (key: string) =>
    setRows((prev) => prev.filter((r) => r.key !== key));

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        key: newRowKey(),
        offsetDays: "",
        channel: "EMAIL",
        templateId: templates.find((t) => t.isActive)?.id ?? "",
        isActive: true,
      },
    ]);

  // Sérialisation des étapes pour l'action serveur.
  const stepsPayload = JSON.stringify(
    rows.map((r) => ({
      id: r.id,
      offsetDays: r.offsetDays,
      channel: r.channel,
      templateId: r.templateId,
      isActive: r.isActive,
    }))
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      <input type="hidden" name="steps" value={stepsPayload} />

      <div className="space-y-2">
        <Label htmlFor="name">
          Nom de la séquence <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={state.values?.name ?? defaultName}
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Étapes</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={addRow}
          >
            <Plus className="size-4" />
            Ajouter une étape
          </Button>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Aucune étape. Ajoutez-en une pour activer les relances.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.key}
                className="grid gap-3 rounded-md border p-3 sm:grid-cols-[120px_1fr_1fr_auto]"
              >
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Délai (jours)
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={row.offsetDays}
                    onChange={(e) =>
                      updateRow(row.key, { offsetDays: e.target.value })
                    }
                    placeholder="7"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Canal</span>
                  <Select
                    value={row.channel}
                    onChange={(e) =>
                      updateRow(row.key, { channel: e.target.value })
                    }
                  >
                    {REMINDER_CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {reminderChannelLabels[c]}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Modèle</span>
                  <Select
                    value={row.templateId}
                    onChange={(e) =>
                      updateRow(row.key, { templateId: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Sélectionnez un modèle…
                    </option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.isActive ? t.name : `${t.name} (archivé)`}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-center">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={row.isActive}
                      onChange={(e) =>
                        updateRow(row.key, { isActive: e.target.checked })
                      }
                      className="size-4"
                    />
                    Active
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.key)}
                    title="Supprimer l'étape"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer la séquence"}
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
