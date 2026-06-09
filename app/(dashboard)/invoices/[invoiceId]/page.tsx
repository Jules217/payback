import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Pencil,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  CheckCheck,
  Settings,
  Mail,
  MessageSquare,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import {
  markInvoiceAsPaid,
  cancelInvoice,
} from "@/app/(dashboard)/invoices/actions";
import { simulateReminderForInvoice } from "@/app/(dashboard)/reminders/actions";
import { SimulateButton } from "@/components/invoices/simulate-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  invoiceStatusLabels,
  invoiceStatusVariants,
  reminderEventStatusLabels,
  reminderEventStatusVariants,
  reminderToneLabels,
  reminderToneVariants,
  reminderChannelLabels,
  stepOffsetLabel,
} from "@/lib/labels";
import { displayStatus, daysOverdue } from "@/lib/invoices/status";
import { eligibleSteps, consumedOffsets } from "@/lib/reminders/eligible-steps";
import { renderTemplate } from "@/lib/reminders/render-template";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ invoiceId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { invoiceId } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { number: true },
  });
  return { title: invoice ? `Facture ${invoice.number}` : "Facture" };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/** Raison précise de l'absence de relances disponibles. */
type ReminderCase =
  | "paid"
  | "cancelled"
  | "not_overdue"
  | "no_active_steps"
  | "all_done"
  | "available";

function getReminderCase(params: {
  status: string;
  late: number;
  simulableCount: number;
  applicableCount: number;
}): ReminderCase {
  if (params.status === "PAID") return "paid";
  if (params.status === "CANCELLED") return "cancelled";
  if (params.late === 0) return "not_overdue";
  if (params.simulableCount === 0) return "no_active_steps";
  if (params.applicableCount === 0) return "all_done";
  return "available";
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { invoiceId } = await params;
  const org = await getCurrentOrganization();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: org.id },
    include: {
      client: true,
      reminderEvents: { orderBy: { scheduledAt: "desc" } },
    },
  });

  if (!invoice) notFound();

  const shown = displayStatus(invoice);
  const late = shown === "OVERDUE" ? daysOverdue(invoice) : 0;
  const isClosed = invoice.status === "PAID" || invoice.status === "CANCELLED";

  const markPaid = markInvoiceAsPaid.bind(null, invoice.id);
  const cancel = cancelInvoice.bind(null, invoice.id);

  // Séquence active de l'organisation → étapes de relance éligibles.
  const sequence = await prisma.reminderSequence.findFirst({
    where: { organizationId: org.id, isActive: true },
    include: {
      steps: { orderBy: { order: "asc" }, include: { template: true } },
    },
  });

  // Seules les étapes actives disposant d'un modèle peuvent être simulées.
  const simulableSteps = (sequence?.steps ?? []).filter(
    (s) => s.isActive && s.templateId
  );

  const applicableSteps = eligibleSteps(
    invoice,
    simulableSteps,
    invoice.reminderEvents
  ).map((step) => ({
    step,
    rendered: renderTemplate({
      subjectTemplate: step.template?.subject ?? "",
      bodyTemplate: step.template?.body ?? "",
      invoice,
      client: invoice.client,
      organization: org,
    }),
  }));

  const reminderCase = getReminderCase({
    status: invoice.status,
    late,
    simulableCount: simulableSteps.length,
    applicableCount: applicableSteps.length,
  });

  // Étapes déjà consommées (pour le message "all_done")
  const done = consumedOffsets(invoice.reminderEvents);

  // Jours restants avant l'échéance (négatif = dépassé)
  const daysUntilDue = Math.ceil(
    (new Date(invoice.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux factures
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{invoice.number}</h2>
            <Badge variant={invoiceStatusVariants[shown]}>
              {invoiceStatusLabels[shown]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            <Link
              href={`/clients/${invoice.client.id}`}
              className="hover:text-foreground hover:underline"
            >
              {invoice.client.name}
            </Link>
            {invoice.client.companyName
              ? ` — ${invoice.client.companyName}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!isClosed ? (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className={buttonVariants({
                variant: "outline",
                className: "gap-2",
              })}
            >
              <Pencil className="size-4" />
              Modifier
            </Link>
          ) : null}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
            <form action={markPaid}>
              <Button type="submit" className="gap-2">
                <CheckCircle2 className="size-4" />
                Marquer payée
              </Button>
            </form>
          ) : null}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
            <form action={cancel}>
              <Button type="submit" variant="outline" className="gap-2">
                <XCircle className="size-4" />
                Annuler
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {late > 0 ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          En retard de {late} jour{late > 1 ? "s" : ""} sur l&apos;échéance.
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow
              label="Montant"
              value={formatCurrency(invoice.amountCents, invoice.currency)}
            />
            <InfoRow
              label="Statut réel"
              value={invoiceStatusLabels[invoice.status]}
            />
            <InfoRow label="Émission" value={formatDate(invoice.issuedAt)} />
            <InfoRow label="Échéance" value={formatDate(invoice.dueAt)} />
            <InfoRow
              label="Payée le"
              value={invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
            />
            <InfoRow
              label="Lien de paiement"
              value={
                invoice.paymentUrl ? (
                  <a
                    href={invoice.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Ouvrir
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.description ? (
              <p className="whitespace-pre-wrap text-sm">
                {invoice.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune description.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Section Relances disponibles ──────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Relances disponibles</CardTitle>
          <CardDescription>
            Étapes applicables selon le retard et l&apos;historique. La
            simulation enregistre un événement sans envoyer de message réel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminderCase === "paid" ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
              <span>
                Facture payée le {formatDate(invoice.paidAt!)} — aucune relance
                nécessaire.
              </span>
            </div>
          ) : reminderCase === "cancelled" ? (
            <p className="text-sm text-muted-foreground">
              Facture annulée — aucune relance possible.
            </p>
          ) : reminderCase === "not_overdue" ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="mt-0.5 size-4 shrink-0" />
              <span>
                La facture n&apos;est pas encore en retard
                {daysUntilDue > 0
                  ? ` (échéance dans ${daysUntilDue} jour${daysUntilDue > 1 ? "s" : ""})`
                  : " (échéance aujourd'hui)"}
                . Les relances apparaissent dès le premier jour de retard.
              </span>
            </div>
          ) : reminderCase === "no_active_steps" ? (
            <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
              <Settings className="mt-0.5 size-4 shrink-0" />
              <span>
                Aucune étape active avec modèle configuré dans la séquence.{" "}
                {sequence ? (
                  <Link
                    href={`/reminders/${sequence.id}/edit`}
                    className="underline hover:no-underline"
                  >
                    Modifier la séquence →
                  </Link>
                ) : (
                  <Link
                    href="/reminders"
                    className="underline hover:no-underline"
                  >
                    Configurer les relances →
                  </Link>
                )}
              </span>
            </div>
          ) : reminderCase === "all_done" ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
              <span>
                Toutes les étapes disponibles ont déjà été simulées pour cette
                facture{" "}
                {done.size > 0
                  ? `(${[...done]
                      .sort((a, b) => a - b)
                      .map(stepOffsetLabel)
                      .join(", ")})`
                  : ""}
                .
              </span>
            </div>
          ) : (
            /* reminderCase === "available" */
            <ul className="space-y-4">
              {applicableSteps.map(({ step, rendered }) => {
                const simulate = simulateReminderForInvoice.bind(
                  null,
                  invoice.id,
                  step.offsetDays
                );
                const label = stepOffsetLabel(step.offsetDays);
                const ChannelIcon =
                  step.template?.channel === "SMS" ? MessageSquare : Mail;
                return (
                  <li key={step.id} className="rounded-md border p-4 space-y-3">
                    {/* En-tête de l'étape */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold">{label}</span>
                          {step.template ? (
                            <Badge variant={reminderToneVariants[step.template.tone]}>
                              {reminderToneLabels[step.template.tone]}
                            </Badge>
                          ) : null}
                          <Badge variant="outline" className="gap-1">
                            <ChannelIcon className="size-3" />
                            {step.template?.channel
                              ? reminderChannelLabels[step.template.channel]
                              : "Email"}
                          </Badge>
                        </div>
                        {step.template ? (
                          <p className="text-xs text-muted-foreground">
                            Modèle :{" "}
                            <Link
                              href={`/templates/${step.template.id}`}
                              className="hover:text-foreground hover:underline"
                            >
                              {step.template.name}
                            </Link>
                          </p>
                        ) : null}
                      </div>
                      <SimulateButton action={simulate} stepLabel={label} />
                    </div>

                    {/* Aperçu repliable */}
                    <details className="group">
                      <summary className="cursor-pointer select-none list-none text-xs font-medium text-muted-foreground hover:text-foreground">
                        <span className="group-open:hidden">
                          ▶ Aperçu du message
                        </span>
                        <span className="hidden group-open:inline">
                          ▼ Masquer l&apos;aperçu
                        </span>
                      </summary>
                      <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
                        {rendered.subject ? (
                          <p className="font-medium">{rendered.subject}</p>
                        ) : null}
                        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                          {rendered.body}
                        </p>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Historique des relances ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des relances</CardTitle>
          <CardDescription>
            Relances enregistrées pour cette facture. Le statut{" "}
            <span className="font-medium">Simulée</span> indique qu&apos;aucun
            email ni SMS réel n&apos;a été envoyé.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invoice.reminderEvents.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Aucune relance enregistrée pour l&apos;instant.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étape</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.reminderEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.offsetDays != null
                        ? stepOffsetLabel(event.offsetDays)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={reminderEventStatusVariants[event.status]}
                      >
                        {reminderEventStatusLabels[event.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {reminderChannelLabels[event.channel] ?? event.channel}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(event.sentAt ?? event.scheduledAt)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {event.messageSubject ? (
                        <p className="font-medium leading-tight">
                          {event.messageSubject}
                        </p>
                      ) : null}
                      {event.messageBody ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {event.messageBody.replace(/\s+/g, " ").trim()}
                        </p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
