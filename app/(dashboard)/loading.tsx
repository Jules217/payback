import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallback générique pour les pages du dashboard sans `loading.tsx` propre.
 * La sidebar et l'en-tête (rendus par le layout) restent visibles ; seul le
 * contenu principal montre ce squelette pendant la latence DB.
 */
export default function DashboardGroupLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
