import Link from "next/link";
import { Wallet, Bell, FileText, Users, ArrowRight, Check } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const starterFeatures = [
  "Clients et factures illimités",
  "Séquences de relance personnalisées",
  "Envoi d'emails aux clients",
  "Historique des relances",
];

const proFeatures = [
  "Tout Starter, plus :",
  "Envoi groupé de relances",
  "Cron automatique quotidien",
  "Priorité support",
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
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            Micro-SaaS de relance amiable
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
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

        {/* Fonctionnalités */}
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

        {/* Tarifs */}
        <section className="mx-auto max-w-4xl px-6 pb-24">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-medium tracking-tight">
              Tarifs simples
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sans engagement. Annulable à tout moment.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>
                  Pour les indépendants et les petites équipes.
                </CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-semibold tabular-nums">19 $</span>
                  <span className="text-sm text-muted-foreground"> / mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {starterFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={buttonVariants({
                    variant: "outline",
                    className: "w-full",
                  })}
                >
                  Commencer
                </Link>
              </CardContent>
            </Card>

            <Card className="border-primary shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge>Recommandé</Badge>
                </div>
                <CardDescription>
                  Pour les cabinets et les équipes en croissance.
                </CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-semibold tabular-nums">49 $</span>
                  <span className="text-sm text-muted-foreground"> / mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {proFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={buttonVariants({ className: "w-full" })}
                >
                  Commencer
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Payback. Tous droits réservés.
      </footer>
    </div>
  );
}
