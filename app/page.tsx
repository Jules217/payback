import Link from "next/link";
import { Wallet, Bell, FileText, Users, ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Clients centralisés",
    description: "Regroupez vos clients et leurs coordonnées en un seul endroit.",
  },
  {
    icon: FileText,
    title: "Factures en retard",
    description: "Suivez les échéances et identifiez les impayés en un coup d'œil.",
  },
  {
    icon: Bell,
    title: "Relances automatiques",
    description: "Configurez des scénarios de relance amiable par email.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <Wallet className="size-6 text-primary" />
          <span className="text-lg font-semibold">Payback</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Connexion
          </Link>
          <Link href="/register" className={buttonVariants()}>
            Commencer
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            Micro-SaaS de relance amiable
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Récupérez vos impayés sans y passer vos journées
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Payback automatise la relance amiable de vos factures en retard.
            Pensé pour les indépendants, petites entreprises, cabinets et
            secrétaires administratives.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className={buttonVariants({ size: "lg", className: "gap-2" })}
            >
              Créer un compte <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Voir la démo
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent />
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Payback. Tous droits réservés.
      </footer>
    </div>
  );
}
