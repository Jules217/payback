import "server-only";

/**
 * Lecture de la configuration email (Resend) depuis l'environnement.
 *
 * Ce module ne contient AUCUNE clé en dur et n'importe pas le SDK Resend :
 * il peut donc être utilisé depuis les Server Components (page facture) pour
 * savoir si l'envoi est configuré, sans embarquer le client d'envoi.
 *
 * Règle de sécurité : ne jamais logger ni renvoyer `RESEND_API_KEY`.
 */

/** L'adresse de test unique vers laquelle partent les emails à cette étape. */
export function getTestRecipient(): string | null {
  const value = process.env.RESEND_TEST_RECIPIENT?.trim();
  return value ? value : null;
}

/** Expéditeur vérifié sur Resend (ex. "Payback <relances@domaine.com>"). */
export function getFromEmail(): string | null {
  const value = process.env.RESEND_FROM_EMAIL?.trim();
  return value ? value : null;
}

/** Vrai si la clé API Resend est présente (sans jamais exposer sa valeur). */
export function hasResendApiKey(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Vrai si l'envoi réel est entièrement configuré (clé + expéditeur). */
export function isEmailConfigured(): boolean {
  return hasResendApiKey() && Boolean(getFromEmail());
}
