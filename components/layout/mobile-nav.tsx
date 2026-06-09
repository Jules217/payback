"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { dashboardNav } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileNavProps {
  queueCount?: number;
}

function isNavItemActive(href: string, pathname: string): boolean {
  if (pathname !== href && !pathname.startsWith(`${href}/`)) return false;
  return !dashboardNav.some(
    (other) =>
      other.href !== href &&
      other.href.startsWith(`${href}/`) &&
      (pathname === other.href || pathname.startsWith(`${other.href}/`))
  );
}

export function MobileNav({ queueCount = 0 }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Wallet className="size-6 text-primary" />
          <SheetTitle className="text-lg font-semibold">Payback</SheetTitle>
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
              <SheetClose asChild key={item.href}>
                <Link
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
              </SheetClose>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <SheetClose asChild>
            <Link
              href="/logout"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="size-4 shrink-0" />
              Déconnexion
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
