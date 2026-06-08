"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import type { InvoiceFormState } from "@/app/(dashboard)/invoices/actions";
import { INVOICE_STATUSES, CURRENCIES } from "@/lib/validations/invoice";
import { invoiceStatusLabels, currencyLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type InvoiceFormClient = {
  id: string;
  name: string;
  companyName?: string | null;
};

export type InvoiceFormDefaults = {
  clientId?: string;
  number?: string;
  amount?: string;
  currency?: string;
  issuedAt?: string;
  dueAt?: string;
  status?: string;
  paymentUrl?: string;
  description?: string;
};

type InvoiceFormAction = (
  state: InvoiceFormState,
  formData: FormData
) => Promise<InvoiceFormState>;

interface InvoiceFormProps {
  action: InvoiceFormAction;
  clients: InvoiceFormClient[];
  defaults?: InvoiceFormDefaults;
  submitLabel: string;
  cancelHref: string;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function InvoiceForm({
  action,
  clients,
  defaults,
  submitLabel,
  cancelHref,
}: InvoiceFormProps) {
  const [state, formAction, pending] = useActionState<
    InvoiceFormState,
    FormData
  >(action, { ok: false });

  // En cas d'erreur, on privilégie les valeurs ressaisies, sinon les valeurs initiales.
  const v = (field: keyof InvoiceFormDefaults) =>
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
          <Label htmlFor="clientId">
            Client <span className="text-destructive">*</span>
          </Label>
          <Select
            id="clientId"
            name="clientId"
            defaultValue={v("clientId")}
            required
          >
            <option value="" disabled>
              Sélectionnez un client…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName ? `${c.name} — ${c.companyName}` : c.name}
              </option>
            ))}
          </Select>
          <FieldError messages={state.errors?.clientId} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">
            Numéro de facture <span className="text-destructive">*</span>
          </Label>
          <Input
            id="number"
            name="number"
            defaultValue={v("number")}
            placeholder="FAC-2025-001"
            required
          />
          <FieldError messages={state.errors?.number} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">
            Statut <span className="text-destructive">*</span>
          </Label>
          <Select
            id="status"
            name="status"
            defaultValue={v("status") || "DRAFT"}
          >
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {invoiceStatusLabels[s]}
              </option>
            ))}
          </Select>
          <FieldError messages={state.errors?.status} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            Montant <span className="text-destructive">*</span>
          </Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            defaultValue={v("amount")}
            placeholder="1200.00"
            required
          />
          <FieldError messages={state.errors?.amount} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">
            Devise <span className="text-destructive">*</span>
          </Label>
          <Select
            id="currency"
            name="currency"
            defaultValue={v("currency") || "CAD"}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {currencyLabels[c]}
              </option>
            ))}
          </Select>
          <FieldError messages={state.errors?.currency} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issuedAt">
            Date d&apos;émission <span className="text-destructive">*</span>
          </Label>
          <Input
            id="issuedAt"
            name="issuedAt"
            type="date"
            defaultValue={v("issuedAt")}
            required
          />
          <FieldError messages={state.errors?.issuedAt} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueAt">
            Date d&apos;échéance <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dueAt"
            name="dueAt"
            type="date"
            defaultValue={v("dueAt")}
            required
          />
          <FieldError messages={state.errors?.dueAt} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="paymentUrl">Lien de paiement</Label>
          <Input
            id="paymentUrl"
            name="paymentUrl"
            type="url"
            defaultValue={v("paymentUrl")}
            placeholder="https://…"
          />
          <FieldError messages={state.errors?.paymentUrl} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={v("description")}
            placeholder="Prestations facturées, références…"
            rows={4}
          />
          <FieldError messages={state.errors?.description} />
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
