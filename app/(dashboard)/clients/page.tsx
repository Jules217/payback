import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { formatDate } from "@/lib/utils";
import {
  channelLabels,
  clientStatusLabels,
  clientStatusVariants,
} from "@/lib/labels";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const org = await getCurrentOrganization();
  const clients = await prisma.client.findMany({
    where: { organizationId: org.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Clients</h2>
          <p className="text-sm text-muted-foreground">
            {clients.length} client{clients.length > 1 ? "s" : ""} dans{" "}
            {org.name}
          </p>
        </div>
        <Link href="/clients/new" className={buttonVariants({ className: "gap-2" })}>
          <Plus className="size-4" />
          Nouveau client
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-6" />
            </div>
            <div>
              <p className="font-medium">Aucun client pour l&apos;instant</p>
              <p className="text-sm text-muted-foreground">
                Ajoutez votre premier client pour commencer à suivre vos
                factures.
              </p>
            </div>
            <Link
              href="/clients/new"
              className={buttonVariants({ className: "gap-2" })}
            >
              <Plus className="size-4" />
              Nouveau client
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.companyName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.phone ?? "—"}
                    </TableCell>
                    <TableCell>{channelLabels[client.preferredChannel]}</TableCell>
                    <TableCell>
                      <Badge variant={clientStatusVariants[client.status]}>
                        {clientStatusLabels[client.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(client.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Voir
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
