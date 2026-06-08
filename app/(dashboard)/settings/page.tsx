import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Paramètres"
      description="Gérez votre organisation et vos préférences."
      icon={Settings}
      upcoming={[
        "Profil de l'organisation",
        "Membres et rôles",
        "Préférences d'envoi (signature, expéditeur)",
        "Facturation et abonnement (à venir)",
      ]}
    />
  );
}
