# Payback

Micro-SaaS de **relance amiable d'impayés** pour indépendants, petites
entreprises, cabinets et secrétaires administratives.

> État : **étape 1** — base technique propre, navigation et placeholders.
> Aucun service externe n'est requis pour lancer l'app en local.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/) + PostgreSQL / Supabase
- À venir : Auth (Supabase), Resend (email), Stripe, Twilio

## Démarrage

```bash
npm install                 # installe les deps + génère le client Prisma (postinstall)

# 1. Base de données Postgres
cp .env.example .env        # (Windows: copy .env.example .env)
docker compose up -d        # démarre un Postgres local (ou utilisez votre DATABASE_URL)

# 2. Schéma + données de démonstration
npm run db:push             # applique le schéma Prisma à la base
npm run db:seed             # crée l'org, l'utilisateur et 5 clients de démo

# 3. Lancer l'app
npm run dev
```

L'application est disponible sur http://localhost:3000. La page **Clients**
(`/clients`) affiche les clients seedés.

> Pas de Docker ? Renseignez simplement `DATABASE_URL` dans `.env` (Supabase,
> Neon, ou un Postgres existant), puis lancez `db:push` et `db:seed`.
>
> Le client Prisma est régénéré via `npm run db:generate` après toute
> modification de `prisma/schema.prisma`.

## Authentification (temporaire)

L'auth n'est pas encore branchée. Une organisation de démonstration fixe est
résolue côté serveur par `lib/current-organization.ts`. Elle sera remplacée par
la session utilisateur (Supabase Auth) à une étape ultérieure.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Démarre le build de production |
| `npm run lint` | Lint (ESLint / next) |
| `npm run typecheck` | Vérifie les types (tsc) |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:push` | Pousse le schéma vers la base (nécessite `DATABASE_URL`) |
| `npm run db:seed` | Insère les données de démonstration |
| `npm run db:studio` | Ouvre Prisma Studio |

## Structure

```
app/
  (auth)/          login, register
  (dashboard)/     dashboard, clients, invoices, reminders, templates, settings
  api/             routes API (ex. health)
  page.tsx         landing page
components/
  ui/              primitives shadcn/ui
  layout/          sidebar, header, placeholder
lib/               utils, client Prisma, navigation
types/             types métier
prisma/            schéma de base de données
docs/              documentation produit (PRODUCT.md)
```

## Variables d'environnement

Copier `.env.example` en `.env`. Aucune variable n'est requise pour lancer
l'app dans son état actuel (placeholders).
