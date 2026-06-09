import { interpolate } from "@/lib/reminders/render-template";

/**
 * Variables supportées dans les modèles de relance, avec une description courte
 * affichée comme aide dans le formulaire. Le `token` est inséré tel quel.
 */
export const SUPPORTED_VARIABLES: { token: string; description: string }[] = [
  { token: "{{client_name}}", description: "Nom du client" },
  { token: "{{organization_name}}", description: "Nom de votre organisation" },
  { token: "{{invoice_number}}", description: "Numéro de facture" },
  { token: "{{amount}}", description: "Montant formaté" },
  { token: "{{due_date}}", description: "Date d'échéance" },
  { token: "{{payment_link}}", description: "Lien de paiement" },
];

/**
 * Données de démonstration utilisées pour l'aperçu d'un modèle (côté client
 * comme serveur). Valeurs fixes, indépendantes de la base.
 */
export const PREVIEW_VARIABLES: Record<string, string> = {
  client_name: "Jean Martin",
  organization_name: "Payback Demo Agency",
  invoice_number: "FAC-2025-001",
  amount: "1 200,00 $CA",
  due_date: "01 juin 2026",
  payment_link: "https://payback.local/pay/demo",
};

/** Rend un couple sujet/corps avec les données de démonstration. */
export function renderPreview(
  subjectTemplate: string,
  bodyTemplate: string
): { subject: string; body: string } {
  return {
    subject: interpolate(subjectTemplate ?? "", PREVIEW_VARIABLES),
    body: interpolate(bodyTemplate ?? "", PREVIEW_VARIABLES),
  };
}
