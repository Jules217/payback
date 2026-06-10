import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  batchEnqueueForOrg,
  sendQueueForOrg,
} from "@/lib/reminders/batch-enqueue";

type OrgDetail = {
  orgId: string;
  orgName: string;
  ajoutées: number;
  ignorées: number;
  auto_envoyés: number;
  auto_échoués: number;
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

    for (const org of orgs) {
      const { ajoutées, ignorées } = await batchEnqueueForOrg(org, []);
      let auto_envoyés = 0;
      let auto_échoués = 0;

      if (org.autoSendEnabled && ajoutées > 0) {
        const sent = await sendQueueForOrg(org);
        auto_envoyés = sent.envoyés;
        auto_échoués = sent.échoués;
      }

      details.push({
        orgId: org.id,
        orgName: org.name,
        ajoutées,
        ignorées,
        auto_envoyés,
        auto_échoués,
      });
    }

    const total_ajoutées = details.reduce((sum, d) => sum + d.ajoutées, 0);
    const total_ignorées = details.reduce((sum, d) => sum + d.ignorées, 0);
    const total_auto_envoyés = details.reduce((sum, d) => sum + d.auto_envoyés, 0);

    return NextResponse.json({
      ok: true,
      run_at: new Date().toISOString(),
      orgs_processed: orgs.length,
      total_ajoutées,
      total_ignorées,
      total_auto_envoyés,
      détails: details,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
