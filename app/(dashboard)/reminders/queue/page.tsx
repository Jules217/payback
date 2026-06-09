import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { formatCurrency } from "@/lib/utils";
import { stepOffsetLabel } from "@/lib/labels";
import {
  sendQueue,
  dequeueReminder,
} from "@/app/(dashboard)/reminders/actions";
import { SendQueueButton } from "@/components/reminders/send-queue-button";
import { DequeueButton } from "@/components/reminders/dequeue-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "File d'attente" };
export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const org = await getCurrentOrganization();

  const events = await prisma.reminderEvent.findMany({
    where: {
      organizationId: org.id,
      status: "SCHEDULED",
      deliveryMode: "CLIENT",
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      invoice: {
        select: {
          id: true,
          number: true,
          amountCents: true,
          currency: true,
          client: { select: { id: true, name: true } },
        },
      },
    },
  });

  const totalCents = events.reduce((sum, e) => sum + e.invoice.amountCents, 0);
  const currency = events[0]?.invoice.currency ?? "CAD";

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">
            File d&apos;attente
          </h1>
          <p className="text-sm text-muted-foreground">
            Relances prêtes à envoyer
          </p>
        </div>
        <SendQueueButton action={sendQueue} count={events.length} />
      </div>

      {/* File vide */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Aucune relance en attente.
              </p>
              <p className="text-xs text-muted-foreground">
                Ajoutez des relances depuis le{" "}
                <Link
                  href="/invoices"
                  className="underline hover:no-underline"
                >
                  détail d&apos;une facture
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          {/* Bandeau récap */}
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-baseline gap-1.5 text-sm font-medium text-muted-foreground">
              <span>
                {events.length} relance{events.length > 1 ? "s" : ""} en
                attente
              </span>
              <span className="text-foreground">—</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(totalCents, currency)}
              </span>
              <span>au total</span>
            </CardTitle>
          </CardHeader>

          {/* Tableau */}
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>N° facture</TableHead>
                  <TableHead>Étape</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const dequeue = dequeueReminder.bind(null, event.id);
                  const subject = event.messageSubject ?? "";
                  const subjectPreview =
                    subject.length > 60
                      ? `${subject.slice(0, 60)}…`
                      : subject;

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/clients/${event.invoice.client.id}`}
                          className="hover:underline"
                        >
                          {event.invoice.client.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/invoices/${event.invoice.id}`}
                          className="font-mono text-sm hover:underline"
                        >
                          {event.invoice.number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {event.offsetDays != null
                          ? stepOffsetLabel(event.offsetDays)
                          : "—"}
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-muted-foreground">
                        {subjectPreview || (
                          <span className="italic">Sans objet</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(
                          event.invoice.amountCents,
                          event.invoice.currency
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DequeueButton action={dequeue} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
