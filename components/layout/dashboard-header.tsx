"use client";

import { usePathname } from "next/navigation";
import { CircleUser } from "lucide-react";

import { dashboardNav } from "@/lib/navigation";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const pathname = usePathname();
  const current = dashboardNav.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <h1 className="text-base font-semibold">
          {current?.title ?? "Payback"}
        </h1>
        {current?.description ? (
          <p className="text-xs text-muted-foreground">{current.description}</p>
        ) : null}
      </div>

      <Button variant="ghost" size="icon" aria-label="Compte">
        <CircleUser className="size-5" />
      </Button>
    </header>
  );
}
