import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import { formatDate, cn } from "@/lib/utils";
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

const CLIENT_FILTERS = [
  { key: "active", label: "Actifs" },
  { key: "archived", label: "Archivés" },
  { key: "all", label: "Tous" },
] as const;

type ClientFilterKey = (typeof CLIENT_FILTERS)[number]["key"];

type PageProps = { searchParams: Promise<{ filter?: string }> };

export default async function ClientsPage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const activeFilter: ClientFilterKey =
    (CLIENT_FILTERS.find((f) => f.key === filter)?.key as ClientFilterKey) ??
    "active";

  const org = await getCurrentOrganization();

  // Charge tous les clients pour calculer les compteurs.
  const allClients = await prisma.client.findMany({
    where: { organizationId: org.id },
    orderBy: [{ createdAt: "desc" }],
  });

  const counts = {
    active: allClients.filter((c) => c.status === "ACTIVE").length,
    archived: allClients.filter((c) => c.status === "ARCHIVED").length,
    all: allClients.length,
  };

  const clients = allClients.filter((c) => {
    if (activeFilter === "active") return c.status === "ACTIVE";
    if (activeFilter === "archived") return c.status === "ARCHIVED";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Clients</h2>
          <p className="text-sm text-muted-foreground">
            {counts.active} client{counts.active > 1 ? "s" : ""} actif
            {counts.active > 1 ? "s" : ""} dans {org.name}
            {counts.archived > 0 ? ` · ${counts.archived} archivé${counts.archived > 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <Link
          href="/clients/new"
          className={buttonVariants({ className: "gap-2" })}
        >
          <Plus className="size-4" />
          Nouveau client
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {CLIENT_FILTERS.map((f) => {
          const href =
            f.key === "active" ? "/clients" : `/clients?filter=${f.key}`;
          const isActive = f.key === activeFilter;
          return (
            <Link
              key={f.key}
              href={href}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {f.label}{" "}
              <span className={cn("text-xs", isActive ? "opacity-75" : "opacity-60")}>
                ({counts[f.key]})
              </span>
            </Link>
          );
        })}
      </div>

      {allClients.length === 0 ? (
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
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {activeFilter === "archived"
              ? "Aucun client archivé."
              : "Aucun client pour ce filtre."}
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
                  <TableHead>Canal</TableHead>
                  {activeFilter !== "active" ? (
                    <TableHead>Statut</TableHead>
                  ) : null}
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className={
                      client.status === "ARCHIVED"
                        ? "opacity-60"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.companyName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      {channelLabels[client.preferredChannel]}
                    </TableCell>
                    {activeFilter !== "active" ? (
                      <TableCell>
                        <Badge variant={clientStatusVariants[client.status]}>
                          {clientStatusLabels[client.status]}
                        </Badge>
                      </TableCell>
                    ) : null}
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
