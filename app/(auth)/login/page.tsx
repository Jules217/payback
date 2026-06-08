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

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Accédez à votre espace Payback. (Authentification à venir.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="vous@exemple.com" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" placeholder="••••••••" disabled />
        </div>
        <Link href="/dashboard" className={buttonVariants({ className: "w-full" })}>
          Se connecter
        </Link>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="ml-1 font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </CardFooter>
    </Card>
  );
}
