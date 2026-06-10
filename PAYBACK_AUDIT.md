# Audit Payback — état du projet

> Rapport **factuel**, en lecture seule, basé uniquement sur les fichiers réels du dépôt.
> Date de l'audit : 2026-06-09. Branche : `master`. Aucune valeur de secret n'est exposée (noms de variables uniquement).
> Révisé après les étapes de refonte design 1–3 puis une passe de polish : palette « Confiance & calme », polices Fraunces/Hanken/IBM Plex Mono, primitives shadcn supplémentaires, timeline de relance, navigation mobile, dashboard enrichi (buckets d'ancienneté neutres si vides), badges de statut en pastilles inline, hero de la landing en Fraunces.
> Mis à jour après la **queue manuelle de relances** (étapes 1–4) : index partiel `uniq_reminder_active`, baseline Prisma Migrate, `SCHEDULED` dans `CONSUMING_STATUSES`, actions `enqueueReminder`/`dequeueReminder`/`sendQueue`, page `/reminders/queue`, entrée "File d'attente" dans la nav avec badge de compteur.
> Mis à jour après le **batch enqueue** : `batchEnqueueReminders` dans `invoices/actions.ts`, `InvoicesTableClient` (cases à cocher + barre d'action), `checkbox` shadcn ajouté, `/invoices` délègue son tableau au Client Component.
> Mis à jour après l'**intégration Auth Supabase** (phases 1–4) : `@supabase/supabase-js` + `@supabase/ssr`, middleware racine, `getCurrentOrganization` réécrit sur session réelle, login/register/logout fonctionnels, `User.supabaseId`, migration `20260609000002`, `lib/constants.ts` supprimé, `force-dynamic` retiré du layout.

---

## 1. Stack & dépendances

| Élément | Valeur |
| --- | --- |
| Framework | **Next.js 15.1.6**, **App Router** (dossier `app/`, route groups `(auth)` / `(dashboard)`, server actions `"use server"`) |
| Langage | **TypeScript 5.7.3**, `strict: true`, `moduleResolution: bundler`, alias `@/*` |
| React | 19.0.0 / react-dom 19.0.0 |
| Version de Node | **non trouvé** (pas de `.nvmrc`, pas de champ `engines` dans `package.json`) |
| Gestionnaire de paquets | **npm** (présence de `package-lock.json`, scripts `npm run …`) |
| Build/config | `next.config.mjs` (`reactStrictMode: true` uniquement), PostCSS + Autoprefixer |

### Dépendances clés par usage

| Usage | Paquet | Version |
| --- | --- | --- |
| UI / styling | `tailwindcss` | ^3.4.17 |
| UI / styling | `tailwindcss-animate` | ^1.0.7 |
| UI / styling | `class-variance-authority` | ^0.7.1 |
| UI / styling | `clsx` | ^2.1.1 |
| UI / styling | `tailwind-merge` | ^2.6.0 |
| Icônes | `lucide-react` | ^0.469.0 |
| UI / primitives Radix | `@radix-ui/react-dialog`, `-dropdown-menu`, `-separator`, `-tabs`, `-tooltip` | ^1.1 – ^2.1 |
| Graphes | `recharts` | ^2.15.4 |
| ORM / DB | `@prisma/client` | ^6.2.1 (généré v6.19.3) |
| ORM / DB | `prisma` (dev) | ^6.2.1 |
| Auth | `@supabase/supabase-js` | ^2.x |
| Auth | `@supabase/ssr` | ^0.12.0 |
| Email | `resend` | ^6.12.4 |
| Validation | `zod` | ^3.24.1 |
| Serveur | `server-only` | ^0.0.1 |
| Tooling (dev) | `tsx` | ^4.19.2 |
| Lint | `eslint` ^8.57.1 + `eslint-config-next` 15.1.6 | — |

**Auth** : `@supabase/supabase-js` (client JS + admin API) et `@supabase/ssr` (`createServerClient` / `createBrowserClient`, gestion des cookies de session). **SMS : aucune dépendance.** **Paiement : aucune dépendance.** **Data fetching client : aucune dépendance** (pas de React Query / SWR). Tout le data fetching passe par Prisma dans des Server Components.

---

## 2. Arborescence & routes

```
payback/
├─ middleware.ts          protection des routes dashboard (updateSession + redirects)
├─ app/
│  ├─ (auth)/            login, register (fonctionnels), logout/ (Route Handler)
│  ├─ (dashboard)/       layout (sidebar + header [+ burger mobile] + bandeau)
│  │  ├─ dashboard/      KPIs + « à relancer aujourd'hui » + buckets d'ancienneté
│  │  ├─ clients/        liste + new + [clientId] (+ edit)
│  │  ├─ invoices/       liste + new + [invoiceId] (+ edit)
│  │  ├─ reminders/      séquence + [sequenceId] (+ edit) + queue/
│  │  ├─ templates/      liste + new + [templateId] (+ edit)
│  │  └─ settings/       nom de l'organisation + config envoi email
│  ├─ api/health/        route de santé
│  ├─ layout.tsx         root (polices Hanken Grotesk + Fraunces + IBM Plex Mono, metadata)
│  └─ page.tsx           landing
├─ components/
│  ├─ ui/                primitives (badge, button, card, input, label, select, table, textarea,
│  │                     tabs, dialog, dropdown-menu, separator, skeleton, tooltip, sheet, chart)
│  ├─ layout/            sidebar, mobile-nav, dashboard-header, sandbox-banner, page-placeholder
│  ├─ clients/ invoices/ reminders/ templates/ settings/   formulaires & boutons métier
├─ lib/
│  ├─ supabase/          client.ts (browser), server.ts (async SSR), middleware.ts (updateSession)
│  ├─ email/             config, resend (lazy), send-reminder-email
│  ├─ invoices/          status (overdue calculé)
│  ├─ reminders/         eligible-steps, render-template, preview
│  ├─ validations/       client, invoice, template, sequence, settings (zod)
│  └─ (prisma, current-organization, labels, navigation, utils)
├─ prisma/               schema.prisma + seed.ts + migrations/ (migration_lock.toml, 0_init/,
│                        20260609000001_reminder_queue/, 20260609000002_add_supabase_id/)
├─ docs/                 PRODUCT.md, EMAIL_DELIVERY.md
└─ types/                index.ts (types métier indépendants de Prisma)
```

### Routes / pages

| Route | Rôle (une ligne) |
| --- | --- |
| `/` | Landing marketing (hero + 3 features + footer) |
| `/login` | Connexion **fonctionnelle** — formulaire `useActionState` + `loginAction` (Supabase `signInWithPassword`, redirect `/dashboard`) |
| `/register` | Inscription **fonctionnelle** — formulaire `useActionState` + `registerAction` (Supabase `signUp` avec `full_name`, gère email de confirmation) |
| `/logout` | Route Handler GET — `signOut()` Supabase + redirect `/login` |
| `/dashboard` | 4 KPIs (à recouvrer, en retard, payé, clients actifs) + liste « à relancer aujourd'hui » (étapes éligibles) + 3 buckets d'ancienneté (0–30 / 31–60 / 61+ j, teintés seulement si non vides) |
| `/clients` | Liste des clients de l'organisation |
| `/clients/new` | Formulaire création client |
| `/clients/[clientId]` | Détail client + ses factures |
| `/clients/[clientId]/edit` | Édition client |
| `/invoices` | Liste des factures avec statut affiché (OVERDUE calculé) ; badge de statut en **pastille inline** (`flex flex-col items-start`, jamais étirée) + sous-texte « X jours de retard » discret |
| `/invoices/new` | Formulaire création facture |
| `/invoices/[invoiceId]` | Détail facture : relances disponibles (Simuler / Test / Client) + historique |
| `/invoices/[invoiceId]/edit` | Édition facture |
| `/reminders` | Séquence active + timeline des étapes + compteur factures éligibles |
| `/reminders/[sequenceId]` | Détail séquence |
| `/reminders/[sequenceId]/edit` | Édition des étapes (lignes dynamiques, JSON sérialisé) |
| `/reminders/queue` | **File d'attente manuelle** — liste les `ReminderEvent{SCHEDULED/CLIENT}` de l'org ; bandeau récap (N relances, montant total) ; bouton « Retirer » par ligne (dequeue) ; bouton primaire « Envoyer la file (N) » (sendQueue, double-clic confirm) ; état vide calme (icône Inbox) |
| `/templates` | Liste des modèles de message |
| `/templates/new` | Création modèle (preview live) |
| `/templates/[templateId]` | Détail modèle + étapes l'utilisant |
| `/templates/[templateId]/edit` | Édition modèle |
| `/settings` | **Nom de l'organisation** (card `OrgNameForm` + action `updateOrgName`) + **Envoi email** (opt-in, nom d'expéditeur, reply-to) |
| `/api/health` | Endpoint de santé |

---

## 3. Design system actuel (section prioritaire)

### Tailwind

Oui, **Tailwind CSS v3** est le socle. `tailwind.config.ts` : `darkMode: ["class"]`, `container` centré (padding 2rem, max `2xl: 1400px`), couleurs mappées sur des **variables CSS HSL** (`hsl(var(--…))`), radius dérivés de `--radius`, keyframes/animations accordion, plugin `tailwindcss-animate`.

Couleurs thématiques (toutes via variables) : `border, input, ring, background, foreground, primary, secondary, destructive, success, warning, muted, accent, popover, card` (`success` et `warning` ajoutés à `theme.extend.colors`).

`app/globals.css` définit les tokens — direction **« Confiance & calme »** (Encre / Papier / Brume / Sauge / Ambre / Brique), `--radius: 0.625rem` :

```css
:root {
  --background: 45 33% 98%;        /* Papier */    --foreground: 214 35% 14%;  /* Encre */
  --primary: 213 52% 25%;          /* Encre */     --primary-foreground: 45 33% 98%;
  --secondary: 43 20% 93%;         /* Brume */     --muted-foreground: 215 15% 42%;
  --destructive: 11 58% 44%;       /* Brique */    --success: 152 30% 36%;     /* Sauge */
  --warning: 36 64% 46%;           /* Ambre */     --border: 40 15% 87%;
  --ring: 213 52% 25%;             --radius: 0.625rem;
  /* + card, popover, accent, input … */
}
/* Aucun bloc .dark : les tokens sombres ont été retirés → mode clair uniquement. */

@layer base { * { @apply border-border; } body { @apply bg-background text-foreground; } }
```

### shadcn/ui

Oui — `components.json` présent : style **new-york**, `rsc: true`, baseColor **slate** (héritage du générateur shadcn ; les tokens runtime sont la palette « Confiance & calme » ci-dessus), cssVariables, alias `@/components/ui`, `iconLibrary: lucide`. Plusieurs primitives s'appuient désormais sur **Radix** (`@radix-ui/react-dialog` — base du `sheet` —, `-dropdown-menu`, `-separator`, `-tabs`, `-tooltip`) et le wrapper `chart` sur **recharts**.

Primitives existantes (`components/ui/`) : `badge`, `button` (CVA, variants), `card`, `checkbox`, `input`, `label`, `select`, `table`, `textarea`, `tabs`, `dialog`, `dropdown-menu`, `separator`, `skeleton`, `tooltip`, `sheet`, `chart`. (`skeleton` et `chart` sont présents mais **pas encore importés** dans l'app. `checkbox` est utilisé dans `InvoicesTableClient`.)

**Badge** (`components/ui/badge.tsx`, CVA) expose les variants : `default` (Encre), `secondary` (Brume), `destructive` (Brique), `success` (Sauge), `warning` (Ambre), `info` (Encre clair), `outline`. Le mapping statut → variant vit dans `lib/labels.ts` — factures : `DRAFT` secondary · `SENT` outline · `PENDING` warning · `OVERDUE` destructive · `PAID` success · `CANCELLED` secondary + texte rayé ; tons : `GENTLE` success · `PROFESSIONAL` secondary · `FIRM` destructive.

En tableau, le badge de statut se rend en **pastille inline** (largeur du contenu, jamais étirée) : la cellule empile le badge et l'éventuel sous-texte « X jours de retard » (`text-xs text-muted-foreground`) via un conteneur `flex flex-col items-start`. Le rendu est **identique** entre la liste des factures (`/invoices`) et le tableau « Factures » du détail client (qui rend le `<Badge>` directement dans la cellule).

**Cartes d'ancienneté (dashboard)** : la teinte d'alerte (Ambre pour `0–30 j`, Brique pour `31–60`/`61+`) n'est appliquée que si le bucket porte un encours réel (`count > 0 && amountCents > 0`) ; un bucket vide reste **neutre** (`bg-muted/40` + montant en `text-muted-foreground`). Les montants conservent `tabular-nums` dans tous les cas.

### Composants réutilisables (hors `ui/`)

| Chemin | Rôle |
| --- | --- |
| `components/layout/sidebar.tsx` | Nav latérale (desktop ≥ md), surlignage actif via `isNavItemActive` (préfère la route la plus spécifique — `/reminders/queue` ne surligne plus « Relances »), badge Ambre `queueCount` sur « File d'attente » si > 0 |
| `components/layout/mobile-nav.tsx` | Menu burger mobile (`< md`) : `Sheet` reprenant `dashboardNav`, même badge `queueCount` |
| `components/layout/dashboard-header.tsx` | Titre (`font-display`) dérivé du match `href` le plus long dans `dashboardNav` (résout correctement `/reminders/queue` → « File d'attente ») ; prop `queueCount` transmise à `MobileNav` |
| `components/layout/sandbox-banner.tsx` | Bandeau état (démo amber / envoi réel emerald selon `emailSendingEnabled`) |
| `components/layout/page-placeholder.tsx` | Bloc « module en préparation » (générique) |
| `components/clients/client-form.tsx` | Formulaire client |
| `components/invoices/invoice-form.tsx` | Formulaire facture |
| `components/invoices/invoices-table-client.tsx` | Tableau des factures (Client Component) — cases Radix Checkbox, `Set<string>` selectedIds, barre d'action conditionnelle (compteur + bouton « Ajouter à la file (N) »), feedback 4 s, `router.refresh()` après envoi |
| `components/invoices/simulate-button.tsx` | Bouton « Simuler » (confirm inline) |
| `components/invoices/send-test-email-button.tsx` | Bouton « Envoyer email test » |
| `components/invoices/send-client-email-button.tsx` | Bouton « Envoyer au client » + récap garde-fous |
| `components/invoices/enqueue-button.tsx` | Bouton « Ajouter à la file » (`useActionState`, feedback inline ok/ko, se désactive après succès) |
| `components/reminders/dequeue-button.tsx` | Bouton « Retirer » par ligne de queue (confirm deux étapes, retour nul si `state.ok`) |
| `components/reminders/send-queue-button.tsx` | Bouton « Envoyer la file (N) » (double-clic confirm, affiche résumé `envoyés/échoués` après envoi) |
| `components/reminders/sequence-form.tsx` | Édition d'étapes (lignes dynamiques) |
| `components/reminders/sequence-timeline.tsx` | Timeline d'étapes (signature visuelle) + `hasTemplateIssues` |
| `components/templates/template-form.tsx` | Formulaire modèle + preview live + chips variables |
| `components/settings/email-settings-form.tsx` | Formulaire config envoi email |

### Thèmes / icônes / polices

- **Thème clair/sombre** : `darkMode: ["class"]` reste déclaré dans `tailwind.config.ts`, mais les tokens `.dark` ont été **retirés** de `globals.css` et il n'existe ni toggle ni `next-themes` → **mode clair uniquement** (la config `darkMode` et les quelques utilitaires `dark:` résiduels sont inertes).
- **Icônes** : `lucide-react`.
- **Polices** (via `next/font/google`, variables posées sur `<html>`) : **Hanken Grotesk** (`--font-sans`, corps & UI), **Fraunces** (`--font-display`, appliqué au `h1` du header de page `dashboard-header.tsx`, au `h1` du hero de la landing `app/page.tsx` et aux libellés d'étape « J+N » de la timeline ; les sous-titres de section `h2` restent en `font-sans font-semibold`), **IBM Plex Mono** (`--font-mono`, numéros de facture & identifiants). `<body className="font-sans antialiased">`, `<html lang="fr" suppressHydrationWarning>`.

### Construction d'une nouvelle page (aujourd'hui)

Une page du dashboard est un **Server Component** (`async`) exportant `export const dynamic = "force-dynamic"` (les pages individuelles conservent ce pragma ; le `(dashboard)/layout.tsx` ne l'a plus — auto-dynamic via `cookies()`). Elle appelle `getCurrentOrganization()` qui lit la session Supabase et renvoie l'org du user connecté (ou redirige vers `/login`). Le `(dashboard)/layout.tsx` fournit sidebar (desktop) + header (avec burger mobile `Sheet`) + `SandboxBanner`. La page compose des primitives `components/ui/*` (Card, Table, Badge, Button…) ; les interactions (formulaires, confirmations) passent par des **client components** dédiés branchés sur des **server actions** (`useActionState` ou `form action={…}`). La validation se fait côté serveur avec un schéma **zod** de `lib/validations/`.

---

## 4. Modèle de données & persistance

- **DB** : PostgreSQL (`provider = "postgresql"`, `datasource.url = env("DATABASE_URL")`). `docker-compose.yml` fournit un Postgres 16-alpine local.
- **ORM** : **Prisma** (`prisma/schema.prisma`), client en singleton `lib/prisma.ts`.
- **Migrations** : `prisma/migrations/` présent avec deux entrées :
  - `0_init/migration.sql` — baseline DDL complet de tout le schéma, appliqué via `migrate resolve --applied 0_init` (la DB existait avant l'adoption de `migrate`).
  - `20260609000001_reminder_queue/migration.sql` — index partiel `uniq_reminder_active` (voir ci-dessous).
  - `20260609000002_add_supabase_id/migration.sql` — ajoute `"supabaseId" TEXT` + index unique sur `User`.

### Modèles (champs principaux)

| Modèle | Champs clés |
| --- | --- |
| `User` | id, **supabaseId** (String?, unique — lien vers l'identité Supabase Auth), email (unique), name, timestamps · relation `memberships` |
| `Organization` | id, name, email, **emailSendingEnabled** (bool, défaut false), **emailFromName**, **emailReplyTo** · relations clients/invoices/payments/sequences/templates/events |
| `Membership` | userId, organizationId, role (`MemberRole OWNER/ADMIN/MEMBER`), unique (user, org) |
| `Client` | name, companyName, email, phone, preferredChannel (`EMAIL/SMS/BOTH`), language (`FR/EN`), status (`ACTIVE/ARCHIVED`), notes |
| `Invoice` | number, amountCents (Int), currency (défaut `CAD`), issuedAt, dueAt, status (`DRAFT/SENT/PENDING/OVERDUE/PAID/CANCELLED`), paymentUrl, paidAt |
| `Payment` | amountCents, currency (défaut `EUR`), method (`CASH/BANK_TRANSFER/CARD/CHECK/OTHER`), paidAt, note |
| `ReminderSequence` | name, isActive, relation `steps` |
| `ReminderStep` | offsetDays (Int), channel (`EMAIL/SMS`), order, isActive, templateId (nullable, `onDelete: SetNull`) |
| `MessageTemplate` | name, subject, body, channel, tone (`GENTLE/PROFESSIONAL/FIRM`), language, isActive |
| `ReminderEvent` | channel, status (`SCHEDULED/SIMULATED/SENT/FAILED/CANCELLED`), scheduledAt, sentAt, offsetDays, messageSubject/messageBody, providerMessageId, errorMessage, **recipientEmail**, **deliveryMode** (`ReminderDeliveryMode SIMULATION/TEST/CLIENT`) · **Index partiel** `uniq_reminder_active` (`invoiceId, offsetDays, deliveryMode`) `WHERE status IN ('SCHEDULED','SENT')` — bloque l'enqueue doublon et garantit une seule relance active par (facture, offset, mode). |

> ⚠️ Incohérence mineure : `Invoice.currency` par défaut `CAD` mais `Payment.currency` par défaut `EUR`. Le `formatCurrency` de `lib/utils.ts` a un défaut `EUR` alors que le seed génère du `CAD`.

### Données « mode démo » / seed

`prisma/seed.ts` (script `tsx`, idempotent par ids fixes `*_demo_*`) : 1 user démo (`supabaseId: null` explicite, ne conflicte pas avec l'unicité), 1 org `Payback Demo Agency` (id `org_demo_payback`), 1 membership OWNER, 5 clients, 5 factures (couvrant payée/en attente/retard 7 & 30 j/annulée), 3 templates (doux/pro/ferme), 1 séquence `Relance amiable standard` à 3 étapes (J+7/J+14/J+30). Les upsert templates/séquence/étapes utilisent `update: {}` (non destructif) ; `emailSendingEnabled: false` est posé en **create** uniquement. **`lib/current-organization.ts` ne upserte plus l'org démo** — il résout désormais l'org via la session Supabase (premier login → création à la volée d'une org « Mon organisation »). Pour avoir les données démo, il faut lancer le seed et se connecter avec le user démo (qui n'a pas de `supabaseId`, donc non résolvable via l'auth réelle).

---

## 5. Logique métier — relances

- **Séquence J+7 / J+14 / J+30** : pas codée en dur — stockée en base sous forme de `ReminderSequence` + `ReminderStep[]` (offsetDays, channel, order, isActive, templateId). Le seed crée la séquence standard. L'éligibilité est calculée dans `lib/reminders/eligible-steps.ts` : `eligibleSteps(invoice, steps, events)` (J+N applicable si `daysOverdue ≥ N`, facture ni payée ni annulée, offset non « consommé ») et `countEligibleByOffset(…)`.
- **Modèles & tons** : `MessageTemplate` (subject/body avec variables `{{…}}`) + enum `ReminderTone GENTLE/PROFESSIONAL/FIRM`. Le ton d'une étape est **dérivé du template lié**. Rendu via `lib/reminders/render-template.ts` (`interpolate`, tokens : client_name, organization_name, invoice_number, amount, due_date, payment_link ; token inconnu → chaîne vide). Preview live côté client via `lib/reminders/preview.ts`.
- **CONSUMING_STATUSES** (dans `lib/reminders/eligible-steps.ts`) : `["SCHEDULED", "SIMULATED", "SENT"]` — une étape dont l'offset correspond à un événement dans l'un de ces trois statuts est considérée « consommée » et n'est plus éligible. **SCHEDULED a été ajouté** lors de l'implémentation de la queue manuelle ; la page de détail facture calcule un `scheduledOffsets` séparé pour distinguer « En file » (badge Clock, bouton désactivé) de « Déjà traitée » (SIMULATED/SENT).
- **Déclenchement automatique** : **aucun**. Pas de cron, de job planifié ni de queue automatique. Le statut `OVERDUE` lui-même n'est **pas persisté** (calculé à l'affichage, `lib/invoices/status.ts`). Six actions **manuelles** dans `app/(dashboard)/reminders/actions.ts` :
  - `simulateReminderForInvoice` → `ReminderEvent{SIMULATED}` (aucun envoi, anti-doublon strict) ;
  - `sendTestReminderForInvoice` → envoi réel **uniquement** vers `RESEND_TEST_RECIPIENT` (pas d'anti-doublon, confirmation UI) ;
  - `sendClientReminderForInvoice` → envoi réel vers `client.email`, **bloqué tant que `emailSendingEnabled=false`**, anti-doublon par offset en mode CLIENT, confirmation obligatoire.
  - `enqueueReminder(invoiceId, offsetDays, prevState, formData)` → crée un `ReminderEvent{SCHEDULED, CLIENT}` avec snapshot `messageSubject/messageBody` rendu via `renderTemplate`. Guards : email non vide, étape + template actifs, pas de doublon SCHEDULED ni SENT pour cet offset/CLIENT. Revalide `/invoices/{id}`, `/reminders`, `/reminders/queue`, `/dashboard`.
  - `dequeueReminder(eventId, prevState, formData)` → vérifie appartenance à l'org et `status === "SCHEDULED"`, puis supprime l'événement. Mêmes `revalidatePath`.
  - `sendQueue(prevState, formData)` → charge tous les `SCHEDULED/CLIENT` de l'org (ordre `scheduledAt`), envoie séquentiellement via `sendReminderEmail` en réutilisant le snapshot (`messageSubject`/`messageBody`), met à jour chaque événement en `SENT` (succès) ou `FAILED` (erreur), continue en cas d'échec individuel. Retourne `{ ok, envoyés, échoués, détails[] }` avec `message` pluralisé. Bloqué si `emailSendingEnabled=false`. Revalide `/reminders/queue` et `/dashboard`.
- **Batch enqueue** (`batchEnqueueReminders(invoiceIds[])` dans `app/(dashboard)/invoices/actions.ts`) : détermine automatiquement la **première étape éligible** (offset le plus petit, via `eligibleSteps()`) pour chaque facture de la liste ; crée un `ReminderEvent{SCHEDULED, CLIENT}` avec snapshot par facture éligible. Factures sans étape éligible, sans email client, ou en doublon (index partiel) → ignorées silencieusement. Retourne `{ ok, ajoutées, ignorées, message }`. Bloqué si `emailSendingEnabled=false`. Pas de `revalidatePath` — le Client Component appelle `router.refresh()`. La page `/invoices` reste **Server Component** ; elle sérialise les dates en `.toISOString()` et délègue le rendu du tableau à `InvoicesTableClient`.

---

## 6. Intégrations externes

| Intégration | État réel | Variables d'env (noms, valeurs masquées) |
| --- | --- | --- |
| **Email — Resend** | **Branché** (SDK `resend`, client lazy `lib/email/resend.ts`). Envoi réel possible vers l'adresse de test ou, si opt-in, vers `client.email`. Fonctionne sans clé au build (init paresseuse, `EmailConfigError` propre). | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TEST_RECIPIENT` (présents et **vides** dans `.env.example`) |
| **SMS — Twilio** | **Non branché / non installé.** `ReminderChannel.SMS` existe dans le modèle mais aucun envoi SMS. | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (commentés dans `.env.example`) |
| **Paiement — Stripe** | **Non branché / non installé.** `Invoice.paymentUrl` est un simple champ texte (liens factices dans le seed, ex. `https://pay.payback-demo.app/…`). | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (commentés) |
| **Auth — Supabase** | **Branché** (`@supabase/supabase-js` + `@supabase/ssr`). Login / register / logout fonctionnels. Routes dashboard protégées par `middleware.ts` racine. Session gérée via cookie `sb-{ref}-auth-token` rafraîchi à chaque requête par `updateSession`. Provisionnement automatique User+Org+Membership au 1er login. | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (présents dans `.env`) |
| **Base de données** | Requise. | `DATABASE_URL` |
| **App** | — | `NEXT_PUBLIC_APP_URL` |

> Sécurité : `lib/email/config.ts` et `resend.ts` ne renvoient/loggent jamais la clé. `lib/prisma.ts` active toutefois `log: ["query","error","warn"]` en dev (verbeux, pas de secret mais bruyant).

---

## 7. Auth & multi-tenant

### Authentification (Supabase — opérationnelle)

| Fichier | Rôle |
| --- | --- |
| `lib/supabase/client.ts` | `createBrowserClient` (`@supabase/ssr`) — usage côté client uniquement |
| `lib/supabase/server.ts` | `createServerClient` async (`await cookies()`) — Server Components, Actions, Route Handlers |
| `lib/supabase/middleware.ts` | `updateSession(request)` — rafraîchit le cookie de session et retourne `{ response, user }` |
| `middleware.ts` (racine) | Lit la session via `updateSession`, redirige les routes protégées vers `/login` si `!user`, redirige `/login`/`/register` vers `/dashboard` si `user` |
| `app/(auth)/login/actions.ts` | `loginAction` — `signInWithPassword` → cookie posé par `@supabase/ssr` → `redirect('/dashboard')` |
| `app/(auth)/register/actions.ts` | `registerAction` — `signUp` (avec `full_name` dans `user_metadata`) → si `session` : `redirect('/dashboard')` ; sinon message de confirmation email |
| `app/(auth)/logout/route.ts` | Route Handler GET — `signOut()` + `redirect('/login')` |
| `lib/current-organization.ts` | Point d'entrée unique pour toutes les pages : `supabase.auth.getUser()` → lookup `User` par `supabaseId` → si absent : création à la volée (transaction `User + Organization + Membership OWNER`) → retourne `membership.organization` |

**Routes protégées** : `/dashboard`, `/clients`, `/invoices`, `/reminders`, `/templates`, `/settings` — toute requête sans session valide est redirigée vers `/login` par le middleware.

**Cookie de session** : `sb-{ref}-auth-token` (JSON sérialisé, 1 chunk car < 3180 chars), `httpOnly: false`, `sameSite: Lax`. Rafraîchi à chaque requête par le middleware via `setAll`.

### Multi-tenant

Modélisation propre en base (`Organization` ↔ `Membership` ↔ `User`) avec `organizationId` sur toutes les entités (index, `onDelete: Cascade`). **Isolation réelle** : `getCurrentOrganization()` renvoie l'org du user connecté ; chaque requête Prisma est scopée sur cet `org.id`. Plusieurs tenants sont supportés de facto — un user peut posséder plusieurs orgs (membership lookup `orderBy: createdAt asc` pour prendre la plus ancienne).

**Provisionnement premier login** : si `User.supabaseId` absent en base, une transaction crée `Organization { name: "Mon organisation" }` + `User { supabaseId, email, name }` + `Membership { OWNER }` et retourne la nouvelle org. L'utilisateur est immédiatement fonctionnel.

**User démo** (seed) : `supabaseId: null` → non résolvable via l'auth Supabase ; accessible uniquement via les scripts de dev. `lib/constants.ts` (qui portait les `DEMO_*`) a été supprimé.

---

## 8. État, qualité & dette technique

| Sujet | Constat |
| --- | --- |
| État client | Aucun gestionnaire global (pas de React Query/SWR/Zustand/Context). État local via `useState`/`useActionState` ; data via Server Components + Prisma. |
| Tests | **Aucun** (pas de Jest/Vitest/Playwright, aucun fichier `*.test.*` / `*.spec.*`). |
| Linter | ESLint configuré (`next/core-web-vitals` + `next/typescript`). `npm run typecheck` (tsc strict) disponible. |
| Formatter | **Non trouvé** (pas de `.prettierrc` ni de dépendance Prettier). |
| CI | **Non trouvé** (pas de `.github/workflows`). |

### Zones « mock / démo / temporaire » à remplacer

- `components/layout/page-placeholder.tsx` — bloc « module en préparation » **désormais orphelin** (aucun import dans `app/` ni `components/`) → supprimable.
- `Invoice.paymentUrl` — liens de paiement **factices** dans le seed (pas de Stripe).
- Aucun `TODO`/`FIXME` littéral dans le code.

> ~~`lib/current-organization.ts`~~ — **résolu** : reécrit sur session Supabase réelle (plus temporaire).
> ~~`lib/constants.ts`~~ — **résolu** : fichier supprimé.
> ~~`app/(auth)/login` & `register`~~ — **résolu** : formulaires fonctionnels avec Supabase Auth.

---

## 9. Mon évaluation (en tant qu'agent)

### 4 faiblesses UX/UI observées dans le code

1. **Config `darkMode` résiduelle** : `darkMode: ["class"]` subsiste dans `tailwind.config.ts` (et quelques utilitaires `dark:` traînent dans des composants) alors que les tokens `.dark` ont été retirés et qu'aucun toggle n'existe → config morte à nettoyer.
2. **Devise incohérente** : seed en `CAD`, `formatCurrency`/`Payment` par défaut `EUR`, dashboard (KPIs + buckets d'ancienneté) prend « la devise de la première facture » → risque d'agrégats mélangeant des devises sans conversion.
3. **États vides ad hoc** : certaines pages s'appuient encore sur des messages bruts (« Lancez le seed pour créer la séquence… » dans `/reminders`) plutôt qu'un état vide guidant l'action (le dashboard, lui, a désormais un état vide calme).
4. **Pas de feedback de chargement** : la primitive `skeleton` a été ajoutée mais n'est importée nulle part et aucune section data n'est enveloppée dans `<Suspense>` → les pages `force-dynamic` affichent la latence DB sans squelette.

> ~~Auth trompeuse~~ — **résolu** : login/register fonctionnels, routes protégées par middleware.

### 4 quick wins techniques

1. **Ajouter Prettier + un workflow CI** (lint + typecheck + build) pour verrouiller la qualité à chaque push.
2. **Réduire le log Prisma en dev** (`["query"]` est bruyant) et n'activer `query` que derrière un flag — gain de lisibilité et perfs.
3. **Centraliser la devise** (champ org `defaultCurrency` ou refus d'agréger des devises différentes) pour fiabiliser le dashboard et les montants.
4. **Premiers tests unitaires ciblés** sur la logique pure déjà bien isolée : `eligible-steps.ts`, `render-template.ts`, `invoices/status.ts`, `reminderEventLabel` — fort ROI, zéro dépendance DB.

> ~~Garde de route minimale~~ — **résolu** : middleware racine opérationnel.

---

## TL;DR de l'état du projet

1. **Next.js 15 (App Router) + TS strict + Tailwind/shadcn + Prisma/Postgres** : base technique propre et cohérente.
2. **Cœur métier relances opérationnel** : clients/factures/templates/séquence CRUD, simulation locale, email **test** et email **client** (opt-in `emailSendingEnabled` + confirmation), historique tracé.
3. **Deux intégrations réelles** : **Resend** (email) et **Supabase** (auth + session + protection des routes). Stripe et Twilio restent réservés.
4. **Auth et multi-tenant opérationnels** : session Supabase, middleware de protection, provisionnement automatique User+Org+Membership au 1er login, isolation par `org.id` effective.
5. **Dette principale** : aucun test, pas de cron (tout manuel), reliquat de config `darkMode`, incohérence de devise.
