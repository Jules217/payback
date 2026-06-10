import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { batchEnqueueForOrg } from "@/lib/reminders/batch-enqueue";

type OrgDetail = {
  orgId: string;
  orgName: string;
  ajoutées: number;
  ignorées: number;
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

    // Traitement par tranches de 5 orgs en parallèle.
    for (let i = 0; i < orgs.length; i += 5) {
      const batch = orgs.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(async (org) => {
          const { ajoutées, ignorées } = await batchEnqueueForOrg(org, []);
          return { orgId: org.id, orgName: org.name, ajoutées, ignorées };
        })
      );
      details.push(...results);
    }

    const total_ajoutées = details.reduce((sum, d) => sum + d.ajoutées, 0);
    const total_ignorées = details.reduce((sum, d) => sum + d.ignorées, 0);

    return NextResponse.json({
      ok: true,
      run_at: new Date().toISOString(),
      orgs_processed: orgs.length,
      total_ajoutées,
      total_ignorées,
      détails: details,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
