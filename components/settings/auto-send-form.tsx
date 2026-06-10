"use client";

import { useState, useTransition } from "react";

import { updateAutoSend } from "@/app/(dashboard)/settings/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function AutoSendForm({ defaultEnabled }: { defaultEnabled: boolean }) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    setEnabled(checked);
    setMessage(null);
    startTransition(async () => {
      const result = await updateAutoSend(checked);
      setMessage(result.message ?? null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="autoSendEnabled" className="flex flex-col gap-1 cursor-pointer">
          <span className="font-medium">Activer l&apos;envoi automatique</span>
          <span className="text-xs font-normal text-muted-foreground">
            Le cron du matin envoie toutes les relances éligibles sans
            intervention manuelle.
          </span>
        </Label>
        <Switch
          id="autoSendEnabled"
          checked={enabled}
          onCheckedChange={handleChange}
          disabled={isPending}
        />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
