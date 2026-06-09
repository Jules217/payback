"use client";

import { usePathname } from "next/navigation";
import { CircleUser } from "lucide-react";

import { dashboardNav } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

interface DashboardHeaderProps {
  queueCount?: number;
}

export function DashboardHeader({ queueCount = 0 }: DashboardHeaderProps) {
  const pathname = usePathname();

  // Préfère le match le plus long (le plus spécifique) pour le titre de page.
  const current = [...dashboardNav]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`)
    );

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-3">
        <MobileNav queueCount={queueCount} />
        <div>
          <h1 className="font-display text-lg font-medium tracking-tight">
            {current?.title ?? "Payback"}
          </h1>
          {current?.description ? (
            <p className="text-xs text-muted-foreground">
              {current.description}
            </p>
          ) : null}
        </div>
      </div>

      <Button variant="ghost" size="icon" aria-label="Compte">
        <CircleUser className="size-5" />
      </Button>
    </header>
  );
}
