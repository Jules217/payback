import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Modèles" };

export default function TemplatesPage() {
  return (
    <PagePlaceholder
      title="Modèles de messages"
      description="Rédigez et réutilisez vos modèles de relance."
      icon={Mail}
      upcoming={[
        "Modèles d'email avec objet et corps",
        "Variables dynamiques (nom client, montant, échéance)",
        "Prévisualisation du message",
        "Association aux étapes de relance",
      ]}
    />
  );
}
