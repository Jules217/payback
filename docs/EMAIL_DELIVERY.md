# Envoi d'emails (Resend) — mode test sécurisé

Cette étape ajoute l'**envoi réel d'emails de relance via [Resend](https://resend.com)**,
mais dans un cadre strictement sécurisé : un email réel ne part que vers une
**adresse de test** définie dans l'environnement. **Aucun vrai client n'est
contacté** à ce stade.

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

## 4. Statuts d'événement : SIMULATED / SENT / FAILED

| Statut      | Action déclenchante      | Email réel ? | Champs notables                       |
| ----------- | ------------------------ | ------------ | ------------------------------------- |
| `SIMULATED` | « Simuler la relance »   | Non          | sujet + corps rendus                  |
| `SENT`      | « Envoyer email test »   | Oui (test)   | sujet + corps + `providerMessageId`   |
| `FAILED`    | « Envoyer email test »   | Tentative    | sujet + corps + `errorMessage`        |

La **simulation** reste inchangée et indépendante : elle n'envoie rien et sert à
prévisualiser/journaliser un message.

## 5. Anti-doublon

- **Simulation** : anti-doublon **strict** conservé — une étape (un `offsetDays`)
  déjà simulée ou envoyée ne peut pas être re-simulée (le bouton « Simuler »
  disparaît, l'action refuse).
- **Envoi de test** : **pas** d'anti-doublon serveur, afin de pouvoir retester
  une étape même si une simulation/un envoi existe déjà. Le garde-fou est la
  **confirmation explicite obligatoire** dans l'UI avant chaque envoi. On évite
  ainsi de bloquer les tests tout en empêchant les envois accidentels en rafale.

## 6. Garanties à cette étape

- Les emails de test partent **exclusivement** vers `RESEND_TEST_RECIPIENT` ;
  `client.email` n'est **jamais** utilisé comme destinataire.
- Resend est appelé **côté serveur uniquement** ; la clé n'est jamais exposée au
  client.
- `npm run db:generate`, `npm run typecheck` et `npm run build` passent **sans**
  vraie clé Resend.
- **Ne jamais committer `.env`.**

## 7. Étapes suivantes (hors périmètre actuel)

- Envoi vers le vrai `client.email` (avec garde-fous d'opt-in / environnement).
- Déclenchement automatique (cron) sur l'infrastructure `eligibleSteps` existante.
- SMS (Twilio), webhooks de statut Resend (bounce/délivrabilité).
