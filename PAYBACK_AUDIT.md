# Audit Payback — état du projet

> Rapport **factuel**, en lecture seule, basé uniquement sur les fichiers réels du dépôt.
> Date de l'audit : 2026-06-09. Branche : `master`. Aucune valeur de secret n'est exposée (noms de variables uniquement).
> Révisé après les étapes de refonte design 1–3 puis une passe de polish : palette « Confiance & calme », polices Fraunces/Hanken/IBM Plex Mono, primitives shadcn supplémentaires, timeline de relance, navigation mobile, dashboard enrichi (buckets d'ancienneté neutres si vides), badges de statut en pastilles inline, hero de la landing en Fraunces.

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
| Email | `resend` | ^6.12.4 |
| Validation | `zod` | ^3.24.1 |
| Serveur | `server-only` | ^0.0.1 |
| Tooling (dev) | `tsx` | ^4.19.2 |
| Lint | `eslint` ^8.57.1 + `eslint-config-next` 15.1.6 | — |

**Auth : aucune dépendance.** **SMS : aucune dépendance.** **Paiement : aucune dépendance.** **Data fetching client : aucune dépendance** (pas de React Query / SWR). Tout le data fetching passe par Prisma dans des Server Components.

---

## 2. Arborescence & routes

```
payback/
├─ app/
│  ├─ (auth)/            login, register (layout dédié centré)
│  ├─ (dashboard)/       layout (sidebar + header [+ burger mobile] + bandeau), force-dynamic
│  │  ├─ dashboard/      KPIs + « à relancer aujourd'hui » + buckets d'ancienneté
│  │  ├─ clients/        liste + new + [clientId] (+ edit)
│  │  ├─ invoices/       liste + new + [invoiceId] (+ edit)
│  │  ├─ reminders/      séquence + [sequenceId] (+ edit)
│  │  ├─ templates/      liste + new + [templateId] (+ edit)
│  │  └─ settings/       config envoi email
│  ├─ api/health/        route de santé
│  ├─ layout.tsx         root (polices Hanken Grotesk + Fraunces + IBM Plex Mono, metadata)
│  └─ page.tsx           landing
├─ components/
│  ├─ ui/                primitives (badge, button, card, input, label, select, table, textarea,
│  │                     tabs, dialog, dropdown-menu, separator, skeleton, tooltip, sheet, chart)
│  ├─ layout/            sidebar, mobile-nav, dashboard-header, sandbox-banner, page-placeholder
│  ├─ clients/ invoices/ reminders/ templates/ settings/   formulaires & boutons métier
├─ lib/                  prisma, current-organization, labels, navigation, constants, utils
│  ├─ email/             config, resend (lazy), send-reminder-email
│  ├─ invoices/          status (overdue calculé)
│  ├─ reminders/         eligible-steps, render-template, preview
│  └─ validations/       client, invoice, template, sequence, settings (zod)
├─ prisma/               schema.prisma + seed.ts
├─ docs/                 PRODUCT.md, EMAIL_DELIVERY.md
└─ types/                index.ts (types métier indépendants de Prisma)
```

### Routes / pages

| Route | Rôle (une ligne) |
| --- | --- |
| `/` | Landing marketing (hero + 3 features + footer) |
| `/login`, `/register` | Écrans auth **factices** (champs `disabled`, lien direct vers `/dashboard`) |
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
| `/templates` | Liste des modèles de message |
| `/templates/new` | Création modèle (preview live) |
| `/templates/[templateId]` | Détail modèle + étapes l'utilisant |
| `/templates/[templateId]/edit` | Édition modèle |
| `/settings` | Configuration **Envoi email** (opt-in, nom d'expéditeur, reply-to) |
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

Primitives existantes (`components/ui/`) : `badge`, `button` (CVA, variants), `card`, `input`, `label`, `select`, `table`, `textarea`, `tabs`, `dialog`, `dropdown-menu`, `separator`, `skeleton`, `tooltip`, `sheet`, `chart`. (`skeleton` et `chart` sont présents mais **pas encore importés** dans l'app.)

**Badge** (`components/ui/badge.tsx`, CVA) expose les variants : `default` (Encre), `secondary` (Brume), `destructive` (Brique), `success` (Sauge), `warning` (Ambre), `info` (Encre clair), `outline`. Le mapping statut → variant vit dans `lib/labels.ts` — factures : `DRAFT` secondary · `SENT` outline · `PENDING` warning · `OVERDUE` destructive · `PAID` success · `CANCELLED` secondary + texte rayé ; tons : `GENTLE` success · `PROFESSIONAL` secondary · `FIRM` destructive.

En tableau, le badge de statut se rend en **pastille inline** (largeur du contenu, jamais étirée) : la cellule empile le badge et l'éventuel sous-texte « X jours de retard » (`text-xs text-muted-foreground`) via un conteneur `flex flex-col items-start`. Le rendu est **identique** entre la liste des factures (`/invoices`) et le tableau « Factures » du détail client (qui rend le `<Badge>` directement dans la cellule).

**Cartes d'ancienneté (dashboard)** : la teinte d'alerte (Ambre pour `0–30 j`, Brique pour `31–60`/`61+`) n'est appliquée que si le bucket porte un encours réel (`count > 0 && amountCents > 0`) ; un bucket vide reste **neutre** (`bg-muted/40` + montant en `text-muted-foreground`). Les montants conservent `tabular-nums` dans tous les cas.

### Composants réutilisables (hors `ui/`)

| Chemin | Rôle |
| --- | --- |
| `components/layout/sidebar.tsx` | Nav latérale (desktop ≥ md), surlignage actif via `usePathname` |
| `components/layout/mobile-nav.tsx` | Menu burger mobile (`< md`) : `Sheet` reprenant `dashboardNav` |
| `components/layout/dashboard-header.tsx` | Titre (`font-display`) + description de page dérivés de `dashboardNav` ; intègre le burger mobile |
| `components/layout/sandbox-banner.tsx` | Bandeau état (démo amber / envoi réel emerald selon `emailSendingEnabled`) |
| `components/layout/page-placeholder.tsx` | Bloc « module en préparation » (générique) |
| `components/clients/client-form.tsx` | Formulaire client |
| `components/invoices/invoice-form.tsx` | Formulaire facture |
| `components/invoices/simulate-button.tsx` | Bouton « Simuler » (confirm inline) |
| `components/invoices/send-test-email-button.tsx` | Bouton « Envoyer email test » |
| `components/invoices/send-client-email-button.tsx` | Bouton « Envoyer au client » + récap garde-fous |
| `components/reminders/sequence-form.tsx` | Édition d'étapes (lignes dynamiques) |
| `components/reminders/sequence-timeline.tsx` | Timeline d'étapes (signature visuelle) + `hasTemplateIssues` |
| `components/templates/template-form.tsx` | Formulaire modèle + preview live + chips variables |
| `components/settings/email-settings-form.tsx` | Formulaire config envoi email |

### Thèmes / icônes / polices

- **Thème clair/sombre** : `darkMode: ["class"]` reste déclaré dans `tailwind.config.ts`, mais les tokens `.dark` ont été **retirés** de `globals.css` et il n'existe ni toggle ni `next-themes` → **mode clair uniquement** (la config `darkMode` et les quelques utilitaires `dark:` résiduels sont inertes).
- **Icônes** : `lucide-react`.
- **Polices** (via `next/font/google`, variables posées sur `<html>`) : **Hanken Grotesk** (`--font-sans`, corps & UI), **Fraunces** (`--font-display`, appliqué au `h1` du header de page `dashboard-header.tsx`, au `h1` du hero de la landing `app/page.tsx` et aux libellés d'étape « J+N » de la timeline ; les sous-titres de section `h2` restent en `font-sans font-semibold`), **IBM Plex Mono** (`--font-mono`, numéros de facture & identifiants). `<body className="font-sans antialiased">`, `<html lang="fr" suppressHydrationWarning>`.

### Construction d'une nouvelle page (aujourd'hui)

Une page du dashboard est un **Server Component** (`async`) rendant `export const dynamic = "force-dynamic"`, qui résout l'organisation via `getCurrentOrganization()` puis interroge Prisma directement. Le `(dashboard)/layout.tsx` fournit sidebar (desktop) + header (avec burger mobile `Sheet`) + `SandboxBanner`. La page compose des primitives `components/ui/*` (Card, Table, Badge, Button…) ; les interactions (formulaires, confirmations) passent par des **client components** dédiés branchés sur des **server actions** (`useActionState` ou `form action={…}`). La validation se fait côté serveur avec un schéma **zod** de `lib/validations/`.

---

## 4. Modèle de données & persistance

- **DB** : PostgreSQL (`provider = "postgresql"`, `datasource.url = env("DATABASE_URL")`). `docker-compose.yml` fournit un Postgres 16-alpine local.
- **ORM** : **Prisma** (`prisma/schema.prisma`), client en singleton `lib/prisma.ts`.

### Modèles (champs principaux)

| Modèle | Champs clés |
| --- | --- |
| `User` | id, email (unique), name, timestamps · relation `memberships` |
| `Organization` | id, name, email, **emailSendingEnabled** (bool, défaut false), **emailFromName**, **emailReplyTo** · relations clients/invoices/payments/sequences/templates/events |
| `Membership` | userId, organizationId, role (`MemberRole OWNER/ADMIN/MEMBER`), unique (user, org) |
| `Client` | name, companyName, email, phone, preferredChannel (`EMAIL/SMS/BOTH`), language (`FR/EN`), status (`ACTIVE/ARCHIVED`), notes |
| `Invoice` | number, amountCents (Int), currency (défaut `CAD`), issuedAt, dueAt, status (`DRAFT/SENT/PENDING/OVERDUE/PAID/CANCELLED`), paymentUrl, paidAt |
| `Payment` | amountCents, currency (défaut `EUR`), method (`CASH/BANK_TRANSFER/CARD/CHECK/OTHER`), paidAt, note |
| `ReminderSequence` | name, isActive, relation `steps` |
| `ReminderStep` | offsetDays (Int), channel (`EMAIL/SMS`), order, isActive, templateId (nullable, `onDelete: SetNull`) |
| `MessageTemplate` | name, subject, body, channel, tone (`GENTLE/PROFESSIONAL/FIRM`), language, isActive |
| `ReminderEvent` | channel, status (`SCHEDULED/SIMULATED/SENT/FAILED/CANCELLED`), scheduledAt, sentAt, offsetDays, messageSubject/messageBody, providerMessageId, errorMessage, **recipientEmail**, **deliveryMode** (`ReminderDeliveryMode SIMULATION/TEST/CLIENT`) |

> ⚠️ Incohérence mineure : `Invoice.currency` par défaut `CAD` mais `Payment.currency` par défaut `EUR`. Le `formatCurrency` de `lib/utils.ts` a un défaut `EUR` alors que le seed génère du `CAD`.

### Données « mode démo » / seed

`prisma/seed.ts` (script `tsx`, idempotent par ids fixes `*_demo_*`) : 1 user démo, 1 org `Payback Demo Agency` (id `org_demo_payback`), 1 membership OWNER, 5 clients, 5 factures (couvrant payée/en attente/retard 7 & 30 j/annulée), 3 templates (doux/pro/ferme), 1 séquence `Relance amiable standard` à 3 étapes (J+7/J+14/J+30). Les upsert templates/séquence/étapes utilisent `update: {}` (non destructif) ; `emailSendingEnabled: false` est posé en **create** uniquement. L'org de démo est aussi **upsertée à la volée** par `lib/current-organization.ts` (l'app fonctionne sans avoir lancé le seed).

---

## 5. Logique métier — relances

- **Séquence J+7 / J+14 / J+30** : pas codée en dur — stockée en base sous forme de `ReminderSequence` + `ReminderStep[]` (offsetDays, channel, order, isActive, templateId). Le seed crée la séquence standard. L'éligibilité est calculée dans `lib/reminders/eligible-steps.ts` : `eligibleSteps(invoice, steps, events)` (J+N applicable si `daysOverdue ≥ N`, facture ni payée ni annulée, offset non « consommé ») et `countEligibleByOffset(…)`.
- **Modèles & tons** : `MessageTemplate` (subject/body avec variables `{{…}}`) + enum `ReminderTone GENTLE/PROFESSIONAL/FIRM`. Le ton d'une étape est **dérivé du template lié**. Rendu via `lib/reminders/render-template.ts` (`interpolate`, tokens : client_name, organization_name, invoice_number, amount, due_date, payment_link ; token inconnu → chaîne vide). Preview live côté client via `lib/reminders/preview.ts`.
- **Déclenchement automatique** : **aucun**. Pas de cron, de job planifié ni de queue. Le statut `OVERDUE` lui-même n'est **pas persisté** (calculé à l'affichage, `lib/invoices/status.ts`). Trois actions **manuelles** dans `app/(dashboard)/reminders/actions.ts` :
  - `simulateReminderForInvoice` → `ReminderEvent{SIMULATED}` (aucun envoi, anti-doublon strict) ;
  - `sendTestReminderForInvoice` → envoi réel **uniquement** vers `RESEND_TEST_RECIPIENT` (pas d'anti-doublon, confirmation UI) ;
  - `sendClientReminderForInvoice` → envoi réel vers `client.email`, **bloqué tant que `emailSendingEnabled=false`**, anti-doublon par offset en mode CLIENT, confirmation obligatoire.

---

## 6. Intégrations externes

| Intégration | État réel | Variables d'env (noms, valeurs masquées) |
| --- | --- | --- |
| **Email — Resend** | **Branché** (SDK `resend`, client lazy `lib/email/resend.ts`). Envoi réel possible vers l'adresse de test ou, si opt-in, vers `client.email`. Fonctionne sans clé au build (init paresseuse, `EmailConfigError` propre). | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TEST_RECIPIENT` (présents et **vides** dans `.env.example`) |
| **SMS — Twilio** | **Non branché / non installé.** `ReminderChannel.SMS` existe dans le modèle mais aucun envoi SMS. | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (commentés dans `.env.example`) |
| **Paiement — Stripe** | **Non branché / non installé.** `Invoice.paymentUrl` est un simple champ texte (liens factices dans le seed, ex. `https://pay.payback-demo.app/…`). | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (commentés) |
| **Auth — Supabase** | **Non branché / non installé.** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (commentés) |
| **Base de données** | Requise. | `DATABASE_URL` |
| **App** | — | `NEXT_PUBLIC_APP_URL` |

> Sécurité : `lib/email/config.ts` et `resend.ts` ne renvoient/loggent jamais la clé. `lib/prisma.ts` active toutefois `log: ["query","error","warn"]` en dev (verbeux, pas de secret mais bruyant).

---

## 7. Auth & multi-tenant

- **Authentification** : **inexistante**. `/login` et `/register` sont des maquettes (champs `disabled`) qui pointent directement vers `/dashboard`. Aucune session, aucun middleware de protection des routes `(dashboard)`.
- **Organisation / multi-tenant** : modélisé proprement en base (`Organization` ↔ `Membership` ↔ `User`, et toutes les entités portent `organizationId` avec index et `onDelete: Cascade`). **Mais** l'isolation effective repose sur `lib/current-organization.ts`, helper **TEMPORAIRE** qui **renvoie toujours l'organisation de démo** (`DEMO_ORG_ID`, upsert) — il n'y a donc **qu'un seul tenant** réellement servi (« Payback Demo Agency »). Les requêtes scoprent bien par `org.id`, mais cet `org.id` est constant. `lib/constants.ts` est annoté « À SUPPRIMER lors de l'intégration de l'auth réelle ».

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

- `lib/current-organization.ts` — helper **TEMPORAIRE** (org de démo figée) → à remplacer par la session auth réelle.
- `lib/constants.ts` — `DEMO_*` « À SUPPRIMER lors de l'intégration de l'auth réelle ».
- `app/(auth)/login` & `register` — formulaires **factices** (champs `disabled`, pas de soumission).
- `components/layout/page-placeholder.tsx` — bloc « module en préparation » **désormais orphelin** (aucun import dans `app/` ni `components/`) → supprimable.
- `Invoice.paymentUrl` — liens de paiement **factices** dans le seed (pas de Stripe).
- Aucun `TODO`/`FIXME` littéral dans le code (les marqueurs sont des commentaires « temporaire / à venir / À SUPPRIMER »).

---

## 9. Mon évaluation (en tant qu'agent)

### 5 faiblesses UX/UI observées dans le code

1. **Config `darkMode` résiduelle** : `darkMode: ["class"]` subsiste dans `tailwind.config.ts` (et quelques utilitaires `dark:` traînent dans des composants) alors que les tokens `.dark` ont été retirés et qu'aucun toggle n'existe → config morte à nettoyer.
2. **Auth trompeuse** : `/login`/`/register` ont des champs `disabled` et un bouton qui ouvre le dashboard sans contrôle — confus et non sécurisé (aucune route protégée).
3. **Devise incohérente** : seed en `CAD`, `formatCurrency`/`Payment` par défaut `EUR`, dashboard (KPIs + buckets d'ancienneté) prend « la devise de la première facture » → risque d'agrégats mélangeant des devises sans conversion.
4. **États vides ad hoc** : certaines pages s'appuient encore sur des messages bruts (« Lancez le seed pour créer la séquence… » dans `/reminders`) plutôt qu'un état vide guidant l'action (le dashboard, lui, a désormais un état vide calme).
5. **Pas de feedback de chargement** : la primitive `skeleton` a été ajoutée mais n'est importée nulle part et aucune section data n'est enveloppée dans `<Suspense>` → les pages `force-dynamic` affichent la latence DB sans squelette.

### 5 quick wins techniques

1. **Ajouter Prettier + un workflow CI** (lint + typecheck + build) pour verrouiller la qualité à chaque push.
2. **Réduire le log Prisma en dev** (`["query"]` est bruyant) et n'activer `query` que derrière un flag — gain de lisibilité et perfs.
3. **Centraliser la devise** (champ org `defaultCurrency` ou refus d'agréger des devises différentes) pour fiabiliser le dashboard et les montants.
4. **Premiers tests unitaires ciblés** sur la logique pure déjà bien isolée : `eligible-steps.ts`, `render-template.ts`, `invoices/status.ts`, `reminderEventLabel` — fort ROI, zéro dépendance DB.
5. **Garde de route minimale** : un `middleware.ts` (ou un check dans `(dashboard)/layout.tsx`) qui prépare le branchement auth, même en renvoyant l'org démo, pour éviter d'avoir à réécrire les pages plus tard.

---

## TL;DR de l'état du projet

1. **Next.js 15 (App Router) + TS strict + Tailwind/shadcn + Prisma/Postgres** : base technique propre et cohérente.
2. **Cœur métier relances opérationnel** : clients/factures/templates/séquence CRUD, simulation locale, email **test** et email **client** (opt-in `emailSendingEnabled` + confirmation), historique tracé.
3. **Resend est la seule intégration réelle** ; Stripe, Twilio et Supabase ne sont que des noms de variables réservés.
4. **Pas d'auth ni de vrai multi-tenant** : une org de démo figée via un helper temporaire ; routes dashboard non protégées.
5. **Dette principale** : aucun test, pas de cron (tout manuel), reliquat de config `darkMode`, incohérence de devise, et écrans d'auth factices à remplacer.
