import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * Sous-ensembles de champs nécessaires au rendu d'un template de relance.
 * Compatibles avec les objets renvoyés par Prisma.
 */
export type RenderInvoice = {
  number: string;
  amountCents: number;
  currency: string;
  dueAt: Date | string;
  paymentUrl?: string | null;
};

export type RenderClient = {
  name: string;
  companyName?: string | null;
};

export type RenderOrganization = {
  name: string;
};

export type RenderTemplateInput = {
  subjectTemplate?: string | null;
  bodyTemplate: string;
  invoice: RenderInvoice;
  client: RenderClient;
  organization: RenderOrganization;
};

export type RenderedTemplate = {
  subject: string;
  body: string;
};

/**
 * Variables supportées dans les templates :
 * {{client_name}}, {{organization_name}}, {{invoice_number}},
 * {{amount}}, {{due_date}}, {{payment_link}}.
 *
 * Toute variable inconnue ou dont la valeur est absente est remplacée par une
 * chaîne vide — aucun `{{…}}` ne subsiste dans le rendu final.
 */
export function buildTemplateVariables({
  invoice,
  client,
  organization,
}: Omit<RenderTemplateInput, "subjectTemplate" | "bodyTemplate">): Record<
  string,
  string
> {
  return {
    client_name: client.name ?? "",
    organization_name: organization.name ?? "",
    invoice_number: invoice.number ?? "",
    amount: formatCurrency(invoice.amountCents, invoice.currency),
    due_date: formatDate(invoice.dueAt),
    payment_link: invoice.paymentUrl ?? "",
  };
}

/** Remplace tous les `{{ token }}` ; un token inconnu donne une chaîne vide. */
export function interpolate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_match, key: string) => {
    return variables[key] ?? "";
  });
}

export function renderTemplate({
  subjectTemplate,
  bodyTemplate,
  invoice,
  client,
  organization,
}: RenderTemplateInput): RenderedTemplate {
  const variables = buildTemplateVariables({ invoice, client, organization });
  return {
    subject: interpolate(subjectTemplate ?? "", variables),
    body: interpolate(bodyTemplate ?? "", variables),
  };
}
