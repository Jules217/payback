import { type LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  /** Liste des fonctionnalités prévues, affichées en aperçu. */
  upcoming?: string[];
}

/**
 * Bloc placeholder réutilisé par les pages du dashboard tant que la
 * logique métier n'est pas implémentée.
 */
export function PagePlaceholder({
  title,
  description,
  icon: Icon,
  upcoming = [],
}: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        ) : null}
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en préparation</CardTitle>
          <CardDescription>
            Cette section est un placeholder. La logique métier sera ajoutée
            dans une prochaine étape.
          </CardDescription>
        </CardHeader>
        {upcoming.length > 0 ? (
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {upcoming.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary/60" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
