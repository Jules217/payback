import type { Metadata } from "next";
import { Users } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <PagePlaceholder
      title="Clients"
      description="Gérez vos clients et leurs coordonnées."
      icon={Users}
      upcoming={[
        "Liste des clients avec recherche et filtres",
        "Création et édition d'un client",
        "Coordonnées de contact (email, téléphone)",
        "Historique des factures par client",
      ]}
    />
  );
}
