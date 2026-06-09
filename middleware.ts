import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Routes qui nécessitent une session active. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/clients",
  "/invoices",
  "/reminders",
  "/templates",
  "/settings",
];

function isDashboardRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Pas de session → /login pour les routes protégées
  if (isDashboardRoute(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Déjà authentifié → /dashboard si l'utilisateur visite /login ou /register
  if ((pathname === "/login" || pathname === "/register") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
