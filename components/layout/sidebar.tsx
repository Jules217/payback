"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { dashboardNav } from "@/lib/navigation";

interface SidebarProps {
  queueCount?: number;
}

/**
 * Calcule si un item de nav est actif sans écraser un item plus spécifique.
 * Ex : "Relances" (/reminders) ne s'active plus quand on est sur
 * /reminders/queue, car "File d'attente" est plus précise.
 */
function isNavItemActive(href: string, pathname: string): boolean {
  if (pathname !== href && !pathname.startsWith(`${href}/`)) return false;
  return !dashboardNav.some(
    (other) =>
      other.href !== href &&
      other.href.startsWith(`${href}/`) &&
      (pathname === other.href || pathname.startsWith(`${other.href}/`))
  );
}

export function Sidebar({ queueCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Wallet className="size-6 text-primary" />
        <span className="text-lg font-semibold">Payback</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {dashboardNav.map((item) => {
          const isActive = isNavItemActive(item.href, pathname);
          const Icon = item.icon;
          const badge =
            item.href === "/reminders/queue" && queueCount > 0
              ? queueCount
              : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.title}</span>
              {badge ? (
                <span
                  className={cn(
                    "min-w-[18px] rounded-full px-1.5 py-px text-center text-[10px] font-medium tabular-nums leading-4",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-warning/20 text-warning"
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/logout"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          Déconnexion
        </Link>
        <p className="mt-2 px-3 text-xs text-muted-foreground">Payback — v0.1</p>
      </div>
    </aside>
  );
}
