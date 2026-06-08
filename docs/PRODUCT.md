# Payback — Document produit

## Vision

Payback est un micro-SaaS de **relance amiable d'impayés**. Il aide les
petites structures à se faire payer plus vite, sans y consacrer de temps ni
dégrader la relation client. L'idée : transformer la relance — souvent
repoussée, mal vécue et chronophage — en un processus **automatisé, cadré et
poli**, déclenché à partir des échéances de factures.

L'objectif n'est pas le recouvrement contentieux, mais la **relance amiable**
en amont : des messages réguliers, personnalisés et professionnels qui
rappellent simplement au client qu'une facture est due.

## Cible

- **Indépendants / freelances** : peu de temps administratif, besoin d'être payés.
- **Petites entreprises / TPE** : pas de service comptable dédié.
- **Cabinets** (conseil, libéral, professions réglementées).
- **Secrétaires administratives** qui gèrent la facturation de plusieurs entités.

Point commun : un volume de factures gérable manuellement mais suffisant pour
que la relance devienne pénible, et **aucun outil dédié** (relances faites « à
la main » dans la boîte mail, ou pas faites du tout).

## Modules

| Module | Rôle |
| --- | --- |
| **Clients** | Annuaire des débiteurs (coordonnées, historique). |
| **Factures** | Suivi des factures et de leurs échéances, détection des impayés. |
| **Relances** | Scénarios (séquences) d'étapes de relance et journal des envois. |
| **Modèles** | Modèles de messages réutilisables avec variables dynamiques. |
| **Paramètres** | Organisation, membres, préférences d'envoi. |
| **Tableau de bord** | Vue d'ensemble : impayés, montants, relances à venir. |

## MVP

Périmètre du premier produit livrable :

1. **Authentification** et organisation (multi-tenant simple).
2. **CRUD Clients**.
3. **CRUD Factures** avec statut et date d'échéance.
4. **Scénarios de relance** : séquences d'étapes basées sur des décalages
   (ex. J+0, J+7, J+15 après échéance).
5. **Modèles d'email** avec variables (nom, montant, échéance, n° de facture).
6. **Envoi des relances par email** (via Resend) et **journal des relances**.
7. **Tableau de bord** synthétique.

Stack technique : Next.js (App Router) · TypeScript · Tailwind · shadcn/ui ·
Prisma · PostgreSQL/Supabase · Resend (email).

## Exclusions (hors périmètre initial)

- ❌ Recouvrement **contentieux** / juridique / mise en demeure légale.
- ❌ Comptabilité complète, déclarations, export comptable avancé.
- ❌ Génération / édition de factures (Payback **suit** des factures
  existantes, il ne les crée pas comme un outil de facturation).
- ❌ Paiement en ligne intégré (Stripe **plus tard**).
- ❌ Relance par **SMS / téléphone** (Twilio **plus tard**).
- ❌ Intégrations comptables tierces, multi-devises avancé, application mobile.

## État actuel (étape 1)

Base technique posée : structure du projet, navigation, layout dashboard avec
sidebar, pages placeholder, types métier et schéma Prisma. **Aucun service
externe requis** pour lancer l'app en local. La logique métier, la base de
données et les intégrations seront ajoutées aux étapes suivantes.
