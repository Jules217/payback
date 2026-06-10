import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { getCurrentOrganization } from "@/lib/current-organization";
import { AutoSendForm } from "@/components/settings/auto-send-form";
import { EmailSettingsForm } from "@/components/settings/email-settings-form";
import { OrgNameForm } from "@/components/settings/org-name-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const org = await getCurrentOrganization();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Settings className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Paramètres</h2>
          <p className="text-sm text-muted-foreground">
            Gérez votre organisation et vos préférences.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organisation</CardTitle>
          <CardDescription>
            Informations générales de votre organisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgNameForm defaultName={org.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Envoi email</CardTitle>
          <CardDescription>
            Contrôlez si Payback peut envoyer des relances aux adresses email de
            vos clients. Désactivé par défaut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailSettingsForm
            defaults={{
              emailSendingEnabled: org.emailSendingEnabled,
              emailFromName: org.emailFromName ?? "",
              emailReplyTo: org.emailReplyTo ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Envoi automatique</CardTitle>
          <CardDescription>
            Quand activé, le cron du matin envoie automatiquement toutes les
            relances éligibles sans intervention manuelle. Désactivé par défaut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoSendForm defaultEnabled={org.autoSendEnabled} />
        </CardContent>
      </Card>
    </div>
  );
}
