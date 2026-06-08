import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Factures" };

export default function InvoicesPage() {
  return (
    <PagePlaceholder
      title="Factures"
      description="Suivez vos factures et leurs échéances."
      icon={FileText}
      upcoming={[
        "Liste des factures avec statut (en attente, en retard, payée)",
        "Import et saisie manuelle de factures",
        "Détection automatique des impayés",
        "Rattachement à un scénario de relance",
      ]}
    />
  );
}
