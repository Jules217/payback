"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerAction } from "./actions";
import { Button } from "@/components/ui/button";
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

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {
    ok: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>Démarrez avec Payback.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Votre nom</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Sophie Martin"
              autoComplete="name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="8 caractères minimum"
              autoComplete="new-password"
              required
            />
          </div>
          {state.message && (
            <p
              className={
                state.ok ? "text-sm text-success" : "text-sm text-destructive"
              }
            >
              {state.message}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={pending || state.ok}
          >
            {pending ? "Création…" : "Créer mon compte"}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="ml-1 font-medium text-primary hover:underline"
        >
          Se connecter
        </Link>
      </CardFooter>
    </Card>
  );
}
