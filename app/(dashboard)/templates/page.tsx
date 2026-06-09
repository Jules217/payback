import Link from "next/link";
import type { Metadata } from "next";
import { Mail, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-organization";
import {
  reminderChannelLabels,
  reminderToneLabels,
  reminderToneVariants,
  languageLabels,
} from "@/lib/labels";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Modèles" };
export const dynamic = "force-dynamic";

/** Aperçu court du corps : première ligne tronquée. */
function bodyPreview(body: string): string {
  const firstLine = body.split("\n").find((l) => l.trim().length > 0) ?? "";
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine;
}

export default async function TemplatesPage() {
  const org = await getCurrentOrganization();
  const templates = await prisma.messageTemplate.findMany({
    where: { organizationId: org.id },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Modèles de messages</h2>
            <p className="text-sm text-muted-foreground">
              {templates.length} modèle{templates.length > 1 ? "s" : ""} de
              relance
            </p>
          </div>
        </div>
        <Link
          href="/templates/new"
          className={buttonVariants({ className: "gap-2" })}
        >
          <Plus className="size-4" />
          Nouveau modèle
        </Link>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="size-6" />
            </div>
            <div>
              <p className="font-medium">Aucun modèle pour l&apos;instant</p>
              <p className="text-sm text-muted-foreground">
                Créez votre premier modèle de relance.
              </p>
            </div>
            <Link
              href="/templates/new"
              className={buttonVariants({ className: "gap-2" })}
            >
              <Plus className="size-4" />
              Nouveau modèle
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <Link key={t.id} href={`/templates/${t.id}`} className="block">
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {!t.isActive ? (
                        <Badge variant="outline">Archivé</Badge>
                      ) : null}
                      <Badge variant={reminderToneVariants[t.tone]}>
                        {reminderToneLabels[t.tone]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border px-2 py-0.5">
                      {reminderChannelLabels[t.channel]}
                    </span>
                    <span className="rounded-full border px-2 py-0.5">
                      {languageLabels[t.language]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {t.subject ? (
                    <p className="text-sm font-medium">{t.subject}</p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {bodyPreview(t.body)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
