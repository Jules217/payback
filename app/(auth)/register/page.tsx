import Link from "next/link";
import type { Metadata } from "next";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Créer un compte" };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Démarrez avec Payback. (Authentification à venir.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="organization">Nom de l&apos;organisation</Label>
          <Input id="organization" placeholder="Mon cabinet" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="vous@exemple.com" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" placeholder="••••••••" disabled />
        </div>
        <Link href="/dashboard" className={buttonVariants({ className: "w-full" })}>
          Créer mon compte
        </Link>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="ml-1 font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </CardFooter>
    </Card>
  );
}
