import type { Metadata } from "next";
import { Bell } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Relances" };

export default function RemindersPage() {
  return (
    <PagePlaceholder
      title="Relances"
      description="Configurez vos scénarios et suivez l'historique de relance."
      icon={Bell}
      upcoming={[
        "Scénarios de relance (séquences d'étapes)",
        "Étapes paramétrables (J+0, J+7, J+15…)",
        "Historique des relances envoyées",
        "Statut d'envoi par canal (email, SMS)",
      ]}
    />
  );
}
