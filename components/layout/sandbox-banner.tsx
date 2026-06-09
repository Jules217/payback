export function SandboxBanner() {
  return (
    <div className="border-b bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
      <span className="font-semibold">Mode démo</span> — aucune relance réelle n&apos;est envoyée · les données sont issues du seed
    </div>
  );
}
