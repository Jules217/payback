---
name: payback-design
description: Direction visuelle et règles d'UI pour Payback (Micro-SaaS de relance amiable d'impayés). À utiliser dès que tu crées ou retouches une page, un composant, un écran, un email ou la landing de Payback — même si l'utilisateur ne dit pas explicitement « design ». S'applique à toute UI Next.js/Tailwind/shadcn de ce projet : tokens de couleur, typographie, tableaux, badges de statut, états vides/chargement, navigation, ton des messages. Consulte-la avant d'écrire du JSX dans ce dépôt.
---

# Payback — Direction de design « Confiance & calme »

## Le brief, en une phrase
Payback aide des cabinets, secrétaires et indépendants à réclamer des factures impayées — une tâche stressante et inconfortable. **Le job du design : rendre cet acte calme, maîtrisé et crédible.** L'inspiration n'est pas la fintech-néon ni la startup violette : c'est la sobriété rassurante d'un bon cabinet comptable. Jamais agressif, jamais alarmiste.

Le centre statistique de l'IA (gris slate neutres + Inter + radius 0.5rem) est exactement ce qu'il y a aujourd'hui dans le projet et ce qu'on quitte. On garde shadcn/ui et l'architecture en tokens — on remplace la **direction**.

## Tokens de couleur (à poser dans `app/globals.css`)

Palette nommée : **Encre** (bleu profond, confiance) · **Papier** (fond chaud, calme) · **Brume** (gris chauds, surfaces) · **Sauge** (vert posé = payé/positif) · **Ambre** (en attente) · **Brique** (en retard, clair mais jamais néon).

Remplace le bloc `:root` de `globals.css` par ces valeurs HSL (format `H S% L%`, conserve les noms de variables shadcn existants, ajoute `--success` / `--warning`) :

```css
:root {
  --background: 45 33% 98%;          /* Papier */
  --foreground: 214 35% 14%;         /* Encre profonde (texte) */
  --card: 0 0% 100%;                 --card-foreground: 214 35% 14%;
  --popover: 0 0% 100%;              --popover-foreground: 214 35% 14%;
  --primary: 213 52% 25%;            --primary-foreground: 45 33% 98%;   /* Encre */
  --secondary: 43 20% 93%;           --secondary-foreground: 214 30% 22%;/* Brume */
  --muted: 43 20% 93%;               --muted-foreground: 215 15% 42%;
  --accent: 43 24% 90%;              --accent-foreground: 214 30% 20%;
  --destructive: 11 58% 44%;         --destructive-foreground: 45 33% 98%;/* Brique */
  --success: 152 30% 36%;            --success-foreground: 45 33% 98%;   /* Sauge */
  --warning: 36 64% 46%;             --warning-foreground: 30 45% 14%;   /* Ambre */
  --border: 40 15% 87%;              --input: 40 15% 87%;
  --ring: 213 52% 25%;               --radius: 0.625rem;
}
```

Dans `tailwind.config.ts`, étends `theme.extend.colors` avec `success` et `warning` sur le même modèle que les autres (`DEFAULT: "hsl(var(--success))"`, `foreground: "hsl(var(--success-foreground))"`, idem warning).

> Le **mode sombre** est aujourd'hui mort (tokens `.dark` définis, aucun toggle). Deux options propres : soit on le câble vraiment avec `next-themes` + un toggle, soit on supprime le bloc `.dark`. **Par défaut : clair uniquement, on supprime `.dark`** pour ne pas laisser de code mort. Ne jamais livrer un mode sombre à moitié fait.
>
> Vérifie le contraste AA après application (texte sur Papier, blanc sur Encre/Brique/Sauge, texte foncé sur Ambre).

## Typographie (on quitte Inter)

Trois rôles, branchés via `next/font/google` dans `app/layout.tsx` :

| Rôle | Police | Usage |
| --- | --- | --- |
| Display (`--font-display`) | **Fraunces** | Titres de page (h1), hero de la landing. Un serif doux = gravité + chaleur, le « confiance ». Avec retenue, jamais sur du texte courant. |
| UI / corps (`--font-sans`) | **Hanken Grotesk** | Tout le reste : nav, formulaires, tableaux, boutons, labels. Humaniste, calme, lisible. |
| Données (`--font-mono`) | **IBM Plex Mono** | **Numéros de facture et identifiants uniquement** (`FAC-2025-003`). Touche « grand livre » — c'est la signature discrète. |

```ts
import { Hanken_Grotesk, Fraunces, IBM_Plex_Mono } from "next/font/google";
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
// <html lang="fr" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
```

Mappe-les dans `tailwind.config.ts` → `fontFamily: { sans: ["var(--font-sans)"], display: ["var(--font-display)"], mono: ["var(--font-mono)"] }`.

**Échelle & règles :**
- Titre de page : `font-display`, `text-2xl`/`text-3xl`, `font-medium`, `tracking-tight`.
- Section (h2) : `font-sans font-semibold text-lg`.
- Corps : `font-sans text-sm` (UI dense) à `text-base`.
- Eyebrow / label de KPI : `text-xs font-medium uppercase tracking-wide text-muted-foreground`.
- **Tous les montants** : `tabular-nums` (et alignés à droite dans les tableaux). Les numéros de facture en `font-mono`.

## La signature : la timeline de relance
L'élément à rendre mémorable, et le seul endroit où on « dépense » de l'audace. La séquence J+7 → J+14 → J+30 ne doit pas être un tableau de lignes ni un formulaire JSON : c'est une **timeline horizontale** avec des nœuds colorés par ton (Sauge = doux, Encre = professionnel, Brique = ferme), le canal en petite puce (icône lucide mail/sms), et l'aperçu du message au survol/clic. C'est à la fois le cœur produit et la pièce maîtresse visuelle. Tout le reste autour reste calme et discipliné.

## Mapping statut → couleur (enums Payback)

| Statut facture | Traitement |
| --- | --- |
| `DRAFT` | Badge `muted` (Brume), neutre |
| `SENT` | Badge `primary` discret (Encre, contour) — informatif |
| `PENDING` | Badge `warning` (Ambre) |
| `OVERDUE` | Badge `destructive` (Brique) + détail calme « En retard de 30 j » |
| `PAID` | Badge `success` (Sauge) |
| `CANCELLED` | Badge `muted`, texte barré léger |

| Ton de relance | Couleur du nœud |
| --- | --- |
| `GENTLE` (Doux) | Sauge |
| `PROFESSIONAL` | Encre |
| `FIRM` (Ferme) | Brique |

Ajoute des variants `success` / `warning` / `info` au CVA de `components/ui/badge.tsx` (sur le modèle des variants existants). Canal `EMAIL`/`SMS` = petites puces avec icône lucide, jamais une couleur criarde.

## Conventions de composants
- **Un seul bouton primaire par écran** (Encre plein). Secondaire = contour. Action destructive (Annuler, Archiver) = ghost/contour danger + confirmation obligatoire.
- **Carte KPI** : eyebrow (label uppercase muted) en haut, grand chiffre `tabular-nums` `font-display` ou sans `font-semibold` en dessous, sous-texte discret. Pas de dégradé, pas d'icône décorative gratuite.
- **Tableaux** : pas de zébrures ; séparateurs hairline (`border`), survol de ligne en `accent` subtil ; montants à droite en `tabular-nums` ; statut en Badge ; action « Voir » en lien discret, pas en bouton.
- **États vides** : icône lucide dans un cercle Brume, titre court, une ligne calme, **une** action primaire. Jamais un simple « Lancez le seed… ». Un écran vide est une invitation à agir.
- **Chargement** : ajoute la primitive `skeleton` et enveloppe les sections data dans `<Suspense>` avec des squelettes. Les pages sont `force-dynamic` → la latence DB doit avoir un feedback, jamais un blanc.
- **Navigation mobile (non négociable)** : la sidebar est `hidden md:flex` et il n'y a aucun menu mobile → ajoute un menu `sheet` (burger) qui reprend `dashboardNav`. Un SaaS qui perd sa nav sur mobile fait amateur.

## Primitives shadcn à ajouter
Il manque de quoi composer des écrans riches. Installe : `tabs`, `dialog`, `dropdown-menu`, `separator`, `skeleton`, `tooltip`, `sheet` (nav mobile), et un wrapper `chart` (recharts) pour le dashboard.
```
npx shadcn@latest add tabs dialog dropdown-menu separator skeleton tooltip sheet chart
```
Garde la composition en Server Components ; ne passe en client component que pour l'interaction (formulaires, confirmations, survols), branchés sur les server actions + zod déjà en place.

## Mouvement
Subtil et lent : transitions 150–200 ms `ease-out` sur survol/focus. Dialogs et toasts : fondu + légère montée (8 px). Survol de ligne : changement de fond discret. **Aucun rebond, aucun parallaxe.** Respecte toujours `prefers-reduced-motion`.

## Le ton des messages (capital pour ce produit)
On réclame de l'argent : l'interface doit déstresser l'utilisateur et ne jamais sonner agressif.
- Phrases en minuscule de phrase, verbes simples, voix active. Le bouton dit ce qui se passe : « Envoyer la relance » → toast « Relance envoyée ».
- Calme, jamais alarmiste : « En retard de 30 j », pas « EN RETARD !!! ». Cadre « relance amiable ».
- Rassure le destinataire dans les modèles : proposer un échéancier ou un lien de paiement plutôt que menacer.
- Les erreurs expliquent quoi faire, sans s'excuser et sans jargon système (« Configurez l'expéditeur dans Paramètres », pas « emailSendingEnabled=false »).

## Quality floor (toujours)
Responsive jusqu'au mobile (nav comprise) · contraste AA vérifié · focus clavier visible (anneau Encre) · `prefers-reduced-motion` respecté · `tabular-nums` sur tout montant · une seule action primaire par écran · copie calme et cohérente d'un bout à l'autre du flux.

## Ordre d'application (ROI décroissant)
1. **Tokens + polices + primitives** (ce fichier, sections ci-dessus) — relève tous les écrans d'un coup, c'est le premier chantier.
2. **Dashboard** — graphe « recouvré dans le temps », liste « à relancer aujourd'hui », buckets d'ancienneté (0-30 / 30-60 / 60+ j).
3. **Éditeur de séquence** — passer des lignes JSON à la timeline-signature.

Au moindre doute sur une couleur, une taille ou un ton : reviens à ce fichier et dérive le choix d'ici, ne réinvente pas.
