import "server-only";

import { Resend } from "resend";

import { hasResendApiKey } from "./config";

/**
 * Client Resend — initialisation paresseuse, côté serveur uniquement.
 *
 * - Le client n'est instancié qu'au premier envoi réel : aucune connexion ni
 *   lecture de secret n'a lieu pendant `next build`.
 * - Si `RESEND_API_KEY` est absente, on lève une `EmailConfigError` propre que
 *   l'action serveur transforme en message utilisateur (jamais un crash de build).
 * - La clé n'est jamais renvoyée, loggée ni exposée côté client.
 */

/** Erreur de configuration email (clé/expéditeur manquant). */
export class EmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigError";
  }
}

let client: Resend | null = null;

/** Retourne le client Resend, ou lève une EmailConfigError si non configuré. */
export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || !hasResendApiKey()) {
    throw new EmailConfigError(
      "RESEND_API_KEY n'est pas configurée — impossible d'envoyer un email."
    );
  }
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}
