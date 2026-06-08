import type { Metadata } from "next";
import { Users, FileText, Bell, Wallet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Tableau de bord" };

const stats = [
  { label: "Clients", value: "—", icon: Users },
  { label: "Factures en retard", value: "—", icon: FileText },
  { label: "Relances en attente", value: "—", icon: Bell },
  { label: "Montant à recouvrer", value: "—", icon: Wallet },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bienvenue sur Payback</CardTitle>
          <CardDescription>
            Le tableau de bord affichera bientôt l&apos;activité de relance :
            factures en retard, relances programmées et paiements reçus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les données s&apos;afficheront une fois la base de données et les
            modules métier connectés.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
