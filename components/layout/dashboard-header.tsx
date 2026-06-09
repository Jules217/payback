"use client";

import { usePathname } from "next/navigation";
import { CircleUser } from "lucide-react";

import { dashboardNav } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

export function DashboardHeader() {
  const pathname = usePathname();
  const current = dashboardNav.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
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
