interface SandboxBannerProps {
  /** État de l'opt-in d'envoi réel de l'organisation courante. */
  emailSendingEnabled?: boolean;
}

/**
 * Bandeau d'état affiché en haut du dashboard.
 *
 * Deux textes selon l'opt-in d'envoi réel :
 * - désactivé → rappel que rien ne part automatiquement vers les vrais clients ;
 * - activé → rappel que l'envoi reste manuel (aucun cron / envoi automatique).
 */
export function SandboxBanner({ emailSendingEnabled }: SandboxBannerProps) {
  if (emailSendingEnabled) {
    return (
      <div className="border-b bg-emerald-50 px-4 py-1.5 text-center text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
        <span className="font-semibold">Envoi réel activé</span> — les relances
        peuvent être envoyées aux adresses email des clients après confirmation
        manuelle. Aucun envoi automatique.
      </div>
    );
  }

  return (
    <div className="border-b bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
      <span className="font-semibold">Mode démo</span> — aucun client réel ne
      reçoit de relance automatiquement. Les simulations restent locales, et les
      emails de test partent uniquement vers l&apos;adresse configurée.
    </div>
  );
}
