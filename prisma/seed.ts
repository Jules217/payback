import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Identifiants fixes (alignés sur lib/constants.ts) pour un seed idempotent.
const DEMO_ORG_ID = "org_demo_payback";
const DEMO_ORG_NAME = "Payback Demo Agency";
const DEMO_ORG_EMAIL = "contact@payback-demo.app";

const DEMO_USER_ID = "user_demo_payback";
const DEMO_USER_EMAIL = "demo@payback-demo.app";
const DEMO_USER_NAME = "Utilisateur Démo";

/** Décale une date de `days` jours par rapport à maintenant. */
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const demoClients = [
  {
    id: "client_demo_1",
    name: "Jean Martin",
    companyName: "Cabinet Martin",
    email: "contact@cabinet-martin.fr",
    phone: "+33 1 23 45 67 89",
    preferredChannel: "EMAIL" as const,
    language: "FR" as const,
    notes: "Cabinet comptable, paiement souvent en fin de mois.",
  },
  {
    id: "client_demo_2",
    name: "Sophie Alpha",
    companyName: "Alpha Services",
    email: "facturation@alpha-services.fr",
    phone: "+33 2 34 56 78 90",
    preferredChannel: "BOTH" as const,
    language: "FR" as const,
    notes: "Préfère être relancée par email puis SMS si pas de réponse.",
  },
  {
    id: "client_demo_3",
    name: "Studio Nova",
    companyName: "Studio Nova",
    email: "hello@studionova.com",
    phone: "+33 6 12 34 56 78",
    preferredChannel: "EMAIL" as const,
    language: "EN" as const,
    notes: "Agence créative, contact principal en anglais.",
  },
  {
    id: "client_demo_4",
    name: "Dr. Saint-Laurent",
    companyName: "Clinique Dentaire Saint-Laurent",
    email: "compta@clinique-saintlaurent.fr",
    phone: "+33 4 56 78 90 12",
    preferredChannel: "SMS" as const,
    language: "FR" as const,
    notes: "Secrétariat médical, joignable surtout par SMS.",
  },
  {
    id: "client_demo_5",
    name: "Camille Moreau",
    companyName: "Atelier Moreau",
    email: "atelier.moreau@gmail.com",
    phone: "+33 7 89 01 23 45",
    preferredChannel: "EMAIL" as const,
    language: "FR" as const,
    notes: "Artisan, petites factures régulières.",
  },
];

async function main() {
  console.log("🌱 Seed Payback — démarrage…");

  // Utilisateur de démonstration
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: { email: DEMO_USER_EMAIL, name: DEMO_USER_NAME },
    create: { id: DEMO_USER_ID, email: DEMO_USER_EMAIL, name: DEMO_USER_NAME },
  });
  console.log(`👤 Utilisateur: ${user.email}`);

  // Organisation de démonstration
  const org = await prisma.organization.upsert({
    where: { id: DEMO_ORG_ID },
    update: { name: DEMO_ORG_NAME, email: DEMO_ORG_EMAIL },
    create: { id: DEMO_ORG_ID, name: DEMO_ORG_NAME, email: DEMO_ORG_EMAIL },
  });
  console.log(`🏢 Organisation: ${org.name}`);

  // Adhésion (OWNER)
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: { role: "OWNER" },
    create: { userId: user.id, organizationId: org.id, role: "OWNER" },
  });
  console.log("🔗 Adhésion OWNER créée");

  // Clients de démonstration
  for (const c of demoClients) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        companyName: c.companyName,
        email: c.email,
        phone: c.phone,
        preferredChannel: c.preferredChannel,
        language: c.language,
        notes: c.notes,
        organizationId: org.id,
      },
      create: {
        id: c.id,
        organizationId: org.id,
        name: c.name,
        companyName: c.companyName,
        email: c.email,
        phone: c.phone,
        preferredChannel: c.preferredChannel,
        language: c.language,
        notes: c.notes,
      },
    });
  }
  console.log(`👥 ${demoClients.length} clients créés/à jour`);

  // Quelques factures simples (dont des retards) pour les premiers clients
  const demoInvoices = [
    {
      id: "invoice_demo_1",
      clientId: "client_demo_1",
      number: "FAC-2025-001",
      amountCents: 120000,
      dueAt: daysFromNow(-20),
      status: "OVERDUE" as const,
    },
    {
      id: "invoice_demo_2",
      clientId: "client_demo_1",
      number: "FAC-2025-002",
      amountCents: 45000,
      dueAt: daysFromNow(10),
      status: "PENDING" as const,
    },
    {
      id: "invoice_demo_3",
      clientId: "client_demo_2",
      number: "FAC-2025-003",
      amountCents: 89000,
      dueAt: daysFromNow(-5),
      status: "OVERDUE" as const,
    },
    {
      id: "invoice_demo_4",
      clientId: "client_demo_3",
      number: "FAC-2025-004",
      amountCents: 250000,
      dueAt: daysFromNow(-2),
      status: "PENDING" as const,
    },
    {
      id: "invoice_demo_5",
      clientId: "client_demo_5",
      number: "FAC-2025-005",
      amountCents: 30000,
      dueAt: daysFromNow(-40),
      status: "PAID" as const,
    },
  ];

  for (const inv of demoInvoices) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {
        clientId: inv.clientId,
        number: inv.number,
        amountCents: inv.amountCents,
        dueAt: inv.dueAt,
        status: inv.status,
        organizationId: org.id,
      },
      create: {
        id: inv.id,
        organizationId: org.id,
        clientId: inv.clientId,
        number: inv.number,
        amountCents: inv.amountCents,
        dueAt: inv.dueAt,
        status: inv.status,
      },
    });
  }
  console.log(`🧾 ${demoInvoices.length} factures créées/à jour`);

  console.log("✅ Seed terminé.");
}

main()
  .catch((e) => {
    console.error("❌ Seed échoué:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
