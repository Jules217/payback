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
npm install
npm run dev
```

L'application est disponible sur http://localhost:3000.

> Le client Prisma est généré au `postinstall`. Pour le régénérer après une
> modification du schéma : `npm run db:generate`.

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
