import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  batchEnqueueForOrg,
  sendQueueForOrg,
} from "@/lib/reminders/batch-enqueue";
import { hasProFeatures } from "@/lib/subscription";
import { MAX_EMAILS_PER_CRON_RUN } from "@/lib/reminders/email-quota";

type OrgDetail = {
  orgId: string;
  orgName: string;
  ajoutées: number;
  ignorées: number;
  auto_envoyés: number;
  auto_échoués: number;
  /** Events laissés en file faute de quota org ou de plafond de run (monitoring). */
  restants: number;
};

export async function GET(request: NextRequest) {
  // ── Sécurité : Bearer token ───────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orgs = await prisma.organization.findMany();
    const details: OrgDetail[] = [];

    // Plafond dur, toutes orgs confondues : un run de cron n'envoie jamais plus
    // de MAX_EMAILS_PER_CRON_RUN emails (protège du timeout Vercel et borne le
    // débit global). Le reste de la file part au run suivant.
    let remainingRunBudget = MAX_EMAILS_PER_CRON_RUN;

    for (const org of orgs) {
      if (!hasProFeatures(org)) continue;

      const { ajoutées, ignorées } = await batchEnqueueForOrg(org, []);
      let auto_envoyés = 0;
      let auto_échoués = 0;
      let restants = 0;

      // On draine la file (y compris les reliquats des runs précédents laissés
      // par le plafond/quota) tant qu'il reste du budget — pas seulement quand
      // de nouvelles relances ont été ajoutées.
      if (org.autoSendEnabled && remainingRunBudget > 0) {
        const sent = await sendQueueForOrg(org, { maxToSend: remainingRunBudget });
        auto_envoyés = sent.envoyés;
        auto_échoués = sent.échoués;
        restants = sent.restants;
        remainingRunBudget -= sent.envoyés;
      }

      details.push({
        orgId: org.id,
        orgName: org.name,
        ajoutées,
        ignorées,
        auto_envoyés,
        auto_échoués,
        restants,
      });
    }

    const total_ajoutées = details.reduce((sum, d) => sum + d.ajoutées, 0);
    const total_ignorées = details.reduce((sum, d) => sum + d.ignorées, 0);
    const total_auto_envoyés = details.reduce((sum, d) => sum + d.auto_envoyés, 0);
    const total_restants = details.reduce((sum, d) => sum + d.restants, 0);

    return NextResponse.json({
      ok: true,
      run_at: new Date().toISOString(),
      orgs_processed: orgs.length,
      total_ajoutées,
      total_ignorées,
      total_auto_envoyés,
      total_restants,
      détails: details,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
