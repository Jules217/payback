import { NextResponse } from "next/server";

/**
 * Endpoint de santé — utile pour vérifier que l'app tourne et,
 * plus tard, pour les checks de déploiement.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "payback",
    timestamp: new Date().toISOString(),
  });
}
