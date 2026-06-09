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

  // Factures de démonstration couvrant les principaux cas :
  // payée, en attente, en retard (7 j et 30 j) et annulée.
  const demoInvoices = [
    {
      id: "invoice_demo_1",
      clientId: "client_demo_1",
      number: "FAC-2025-001",
      amountCents: 120000,
      currency: "CAD",
      issuedAt: daysFromNow(-37),
      dueAt: daysFromNow(-7),
      status: "PENDING" as const,
      paidAt: null as Date | null,
      paymentUrl: "https://pay.payback-demo.app/inv/FAC-2025-001",
      description: "Prestation de conseil — janvier.",
    },
    {
      id: "invoice_demo_2",
      clientId: "client_demo_1",
      number: "FAC-2025-002",
      amountCents: 45000,
      currency: "CAD",
      issuedAt: daysFromNow(-5),
      dueAt: daysFromNow(10),
      status: "PENDING" as const,
      paidAt: null as Date | null,
      paymentUrl: null as string | null,
      description: "Acompte sur projet en cours.",
    },
    {
      id: "invoice_demo_3",
      clientId: "client_demo_2",
      number: "FAC-2025-003",
      amountCents: 89000,
      currency: "CAD",
      issuedAt: daysFromNow(-60),
      dueAt: daysFromNow(-30),
      status: "SENT" as const,
      paidAt: null as Date | null,
      paymentUrl: "https://pay.payback-demo.app/inv/FAC-2025-003",
      description: "Maintenance trimestrielle.",
    },
    {
      id: "invoice_demo_4",
      clientId: "client_demo_3",
      number: "FAC-2025-004",
      amountCents: 250000,
      currency: "CAD",
      issuedAt: daysFromNow(-50),
      dueAt: daysFromNow(-20),
      status: "PAID" as const,
      paidAt: daysFromNow(-18),
      paymentUrl: null as string | null,
      description: "Refonte du site — solde.",
    },
    {
      id: "invoice_demo_5",
      clientId: "client_demo_5",
      number: "FAC-2025-005",
      amountCents: 30000,
      currency: "CAD",
      issuedAt: daysFromNow(-25),
      dueAt: daysFromNow(5),
      status: "CANCELLED" as const,
      paidAt: null as Date | null,
      paymentUrl: null as string | null,
      description: "Commande annulée par le client.",
    },
  ];

  for (const inv of demoInvoices) {
    const data = {
      clientId: inv.clientId,
      number: inv.number,
      amountCents: inv.amountCents,
      currency: inv.currency,
      issuedAt: inv.issuedAt,
      dueAt: inv.dueAt,
      status: inv.status,
      paidAt: inv.paidAt,
      paymentUrl: inv.paymentUrl,
      description: inv.description,
      organizationId: org.id,
    };
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: data,
      create: { id: inv.id, ...data },
    });
  }
  console.log(`🧾 ${demoInvoices.length} factures créées/à jour`);

  // ── Templates de message ────────────────────────────────────
  const demoTemplates = [
    {
      id: "template_demo_gentle",
      name: "Rappel doux",
      tone: "GENTLE" as const,
      subject: "Petit rappel : facture {{invoice_number}}",
      body:
        "Bonjour {{client_name}},\n\n" +
        "J'espère que vous allez bien. Sauf erreur de notre part, la facture " +
        "{{invoice_number}} d'un montant de {{amount}}, échue le {{due_date}}, " +
        "reste à régler.\n\n" +
        "Vous pouvez la régler via ce lien : {{payment_link}}\n\n" +
        "Merci par avance,\n{{organization_name}}",
    },
    {
      id: "template_demo_professional",
      name: "Rappel professionnel",
      tone: "PROFESSIONAL" as const,
      subject: "Relance : facture {{invoice_number}} échue",
      body:
        "Bonjour {{client_name}},\n\n" +
        "Nous revenons vers vous concernant la facture {{invoice_number}} d'un " +
        "montant de {{amount}}, dont l'échéance était le {{due_date}} et qui " +
        "demeure impayée à ce jour.\n\n" +
        "Nous vous remercions de bien vouloir procéder au règlement : " +
        "{{payment_link}}\n\n" +
        "Cordialement,\n{{organization_name}}",
    },
    {
      id: "template_demo_firm",
      name: "Dernier rappel amiable",
      tone: "FIRM" as const,
      subject: "Dernier rappel amiable : facture {{invoice_number}}",
      body:
        "Bonjour {{client_name}},\n\n" +
        "Malgré nos précédents rappels, la facture {{invoice_number}} d'un " +
        "montant de {{amount}}, échue le {{due_date}}, reste impayée.\n\n" +
        "Nous vous invitons à régulariser la situation sous les meilleurs délais " +
        "afin d'éviter toute procédure : {{payment_link}}\n\n" +
        "Bien à vous,\n{{organization_name}}",
    },
  ];

  for (const t of demoTemplates) {
    const data = {
      organizationId: org.id,
      name: t.name,
      subject: t.subject,
      body: t.body,
      channel: "EMAIL" as const,
      tone: t.tone,
      language: "FR" as const,
    };
    // update vide : on ne réécrit pas un modèle déjà présent pour préserver les
    // éventuelles modifications faites depuis l'interface en dev.
    await prisma.messageTemplate.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, ...data },
    });
  }
  console.log(`✉️  ${demoTemplates.length} templates créés/à jour`);

  // ── Séquence de relance par défaut ──────────────────────────
  const SEQUENCE_ID = "sequence_demo_standard";
  // update vide : on préserve le nom/état si la séquence a été éditée en dev.
  await prisma.reminderSequence.upsert({
    where: { id: SEQUENCE_ID },
    update: {},
    create: {
      id: SEQUENCE_ID,
      organizationId: org.id,
      name: "Relance amiable standard",
      isActive: true,
    },
  });

  const demoSteps = [
    {
      id: "step_demo_7",
      offsetDays: 7,
      order: 0,
      templateId: "template_demo_gentle",
    },
    {
      id: "step_demo_14",
      offsetDays: 14,
      order: 1,
      templateId: "template_demo_professional",
    },
    {
      id: "step_demo_30",
      offsetDays: 30,
      order: 2,
      templateId: "template_demo_firm",
    },
  ];

  for (const s of demoSteps) {
    const data = {
      sequenceId: SEQUENCE_ID,
      templateId: s.templateId,
      offsetDays: s.offsetDays,
      channel: "EMAIL" as const,
      order: s.order,
    };
    // update vide : on préserve les étapes éventuellement modifiées en dev.
    await prisma.reminderStep.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, ...data },
    });
  }
  console.log(
    `🔁 Séquence « Relance amiable standard » : ${demoSteps.length} étapes`
  );

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
