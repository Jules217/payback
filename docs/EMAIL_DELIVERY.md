# Envoi d'emails (Resend) — simulation, test et envoi client

Payback distingue **trois modes d'acheminement** d'une relance, du plus sûr au
plus engageant :

| Mode             | Email réel ? | Destinataire             | Garde-fou principal                          |
| ---------------- | ------------ | ------------------------ | -------------------------------------------- |
| **Simulation**   | Non          | _(aucun)_                | Aucun envoi — journalise seulement le rendu  |
| **Email test**   | Oui          | `RESEND_TEST_RECIPIENT`  | Ne part **jamais** vers un vrai client       |
| **Envoi client** | Oui          | `client.email`           | Opt-in `emailSendingEnabled` + confirmation  |

> ⚠️ **Aucun envoi automatique** : il n'existe pas de cron. Tout envoi (test ou
> client) est déclenché manuellement depuis l'interface, après confirmation.

## 0. Différence entre les trois modes

- **Simulation** — « Simuler la relance ». Rend le template et enregistre un
  `ReminderEvent` `SIMULATED`. Rien n'est envoyé ; sert à prévisualiser/journaliser.
- **Email test** — « Envoyer email test ». Envoie un vrai email **uniquement**
  vers `RESEND_TEST_RECIPIENT`. Permet de valider le rendu réel sans risque.
- **Envoi client** — « Envoyer au client ». Envoie un vrai email à `client.email`.
  Impossible tant que l'organisation n'a pas **activé l'envoi réel** dans
  `/settings`, et toujours soumis à une **confirmation manuelle** récapitulant le
  destinataire.

## 1. Variables d'environnement

À déclarer dans `.env` (jamais committé — voir `.env.example` pour les noms) :

| Variable                | Rôle                                                                 |
| ----------------------- | ------------------------------------------------------------------- |
| `RESEND_API_KEY`        | Clé API Resend (`re_...`). Côté serveur uniquement.                 |
| `RESEND_FROM_EMAIL`     | Expéditeur vérifié sur Resend, ex. `Payback <relances@mondomaine.com>`. |
| `RESEND_TEST_RECIPIENT` | **Seule** adresse qui reçoit les emails de test à cette étape.       |

> ⚠️ Ne jamais committer, logger ni partager la valeur réelle de `RESEND_API_KEY`.
> Le code ne lit la clé qu'au moment de l'envoi et ne la renvoie jamais.

## 2. Configurer Resend localement

1. Créer un compte sur [resend.com](https://resend.com) et générer une clé API.
2. Pour tester rapidement sans domaine, Resend fournit l'expéditeur
   `onboarding@resend.dev` (utilisable comme `RESEND_FROM_EMAIL`). Pour un envoi
   « propre », vérifier votre domaine dans Resend puis utiliser une adresse de ce
   domaine.
3. Renseigner dans `.env` :

   ```bash
   RESEND_API_KEY=re_votre_cle
   RESEND_FROM_EMAIL="Payback <onboarding@resend.dev>"
   RESEND_TEST_RECIPIENT=vous@exemple.com
   ```

4. (Re)démarrer le serveur de dev : `npm run dev`.

L'application **build et démarre même sans ces variables** : l'initialisation du
client Resend est paresseuse (lazy). En l'absence de `RESEND_API_KEY`, seule
l'action d'envoi de test échoue, avec un message d'erreur propre.

## 3. Tester un envoi email de test

1. Avoir une facture **en retard** (échéance dépassée), ni payée ni annulée,
   rattachée à une séquence active comportant une étape **active** avec un
   **modèle actif** dont le décalage (J+N) est atteint.
2. Ouvrir la facture : section **Relances disponibles**.
3. Sur l'étape voulue, cliquer **Envoyer email test**.
4. Une confirmation rappelle que l'email partira **uniquement** à
   `RESEND_TEST_RECIPIENT`. Confirmer.
5. Vérifier la boîte de réception de l'adresse de test.
6. Le résultat est journalisé dans **Historique des relances** :
   - statut **Envoyée** + `providerMessageId` en cas de succès ;
   - statut **Échouée** + message d'erreur en cas d'échec.

Si `RESEND_TEST_RECIPIENT` n'est pas configuré, le bouton est **désactivé** avec
un message indiquant la variable à renseigner.

## 4. Activer l'envoi réel aux clients

Prérequis pour qu'un email puisse partir vers `client.email` :

1. **Resend configuré** : `RESEND_API_KEY` et `RESEND_FROM_EMAIL` présents (voir §1).
2. **Opt-in organisation** : sur `/settings`, section **Envoi email**, cocher
   **« Activer l'envoi réel aux clients »** puis enregistrer.
   - Tant que cette case est décochée (`emailSendingEnabled = false`, valeur par
     défaut), **aucun** email ne peut partir vers un client — l'action serveur
     refuse et le bouton « Envoyer au client » est désactivé.
   - Optionnel : **nom d'expéditeur** (`emailFromName`) et **reply-to**
     (`emailReplyTo`, email valide) sont appliqués aux envois client.
3. **Client avec email** : la facture doit pointer vers un client ayant une
   adresse email.

Ces réglages sont stockés sur l'`Organization` (champs `emailSendingEnabled`,
`emailFromName`, `emailReplyTo`). Le bandeau du dashboard change de texte une fois
l'envoi réel activé.

## 5. Tester un envoi au client

1. Activer l'envoi réel dans `/settings` (voir §4).
2. Ouvrir une facture **en retard** dont le client a une adresse email.
3. Section **Relances disponibles** → bouton **« Envoyer au client »**.
4. Un récapitulatif **obligatoire** affiche : nom du client, **email
   destinataire**, numéro de facture, montant, étape (J+7/J+14/J+30), sujet
   rendu, et le rappel « Cette action enverra un vrai email au client. ».
5. Confirmer → l'email part vers `client.email` (jamais l'adresse de test).
6. Le résultat est journalisé en mode **CLIENT** : statut **Envoyée client** +
   `providerMessageId`, ou **Échouée (client)** + `errorMessage`. Le destinataire
   réel apparaît dans l'historique.

## 6. Statuts et modes d'événement

Chaque `ReminderEvent` porte un `deliveryMode` (`SIMULATION` / `TEST` / `CLIENT`)
et un `recipientEmail` pour savoir où l'email est (ou serait) parti.

| Libellé historique | Statut + mode      | Email réel ? | Destinataire            |
| ------------------ | ------------------ | ------------ | ----------------------- |
| Simulée            | `SIMULATED` / SIM. | Non          | _(théorique : client)_  |
| Envoyée test       | `SENT` / TEST      | Oui          | `RESEND_TEST_RECIPIENT` |
| Envoyée client     | `SENT` / CLIENT    | Oui          | `client.email`          |
| Échouée (test)     | `FAILED` / TEST    | Tentative    | `RESEND_TEST_RECIPIENT` |
| Échouée (client)   | `FAILED` / CLIENT  | Tentative    | `client.email`          |

## 7. Anti-doublon

- **Simulation** : anti-doublon **strict** — une étape (`offsetDays`) déjà
  simulée ou envoyée ne peut pas être re-simulée (le bouton « Simuler »
  disparaît, l'action refuse).
- **Envoi de test** : **pas** d'anti-doublon serveur, afin de pouvoir retester
  une étape même si une simulation/un envoi existe déjà. Garde-fou = confirmation
  explicite obligatoire dans l'UI.
- **Envoi client** : un **second envoi client réussi** pour le même
  `offsetDays` est **bloqué** (le bouton devient « Envoyé au client » désactivé,
  l'action refuse). Un nouvel essai reste possible si le **dernier envoi client a
  échoué** (`FAILED`). Les simulations et emails de test sont comptabilisés
  séparément (filtrés par `deliveryMode = CLIENT`).

## 8. Garanties

- Un email **client** ne part **jamais** tant que `emailSendingEnabled = false`.
- Un email **test** part **exclusivement** vers `RESEND_TEST_RECIPIENT` ;
  `client.email` n'est jamais utilisé en mode test.
- L'envoi client n'utilise **jamais** `RESEND_TEST_RECIPIENT`.
- **Aucun envoi automatique** : pas de cron, tout passe par une confirmation
  manuelle.
- Resend est appelé **côté serveur uniquement** ; la clé n'est jamais exposée au
  client ni journalisée.
- `npm run db:generate`, `npm run typecheck` et `npm run build` passent **sans**
  vraie clé Resend.
- **Ne jamais committer `.env`.**

## 9. Étapes suivantes (hors périmètre actuel)

- Déclenchement automatique (cron) sur l'infrastructure `eligibleSteps` existante.
- SMS (Twilio), webhooks de statut Resend (bounce/délivrabilité).
- Authentification réelle / multi-tenant (remplace l'organisation de démo).
