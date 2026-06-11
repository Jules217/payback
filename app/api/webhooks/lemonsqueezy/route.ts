import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { SubscriptionStatus, SubscriptionPlan } from "@prisma/client";

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function mapStatus(lsStatus: string): SubscriptionStatus {
  switch (lsStatus) {
    case "on_trial":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "cancelled":
      return "CANCELLED";
    case "expired":
      return "INACTIVE";
    default:
      return "INACTIVE";
  }
}

function mapPlan(variantId: unknown): SubscriptionPlan {
  return String(variantId) === process.env.LEMONSQUEEZY_VARIANT_PRO
    ? "PRO"
    : "STARTER";
}

const HANDLED_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_expired",
]);

export async function POST(request: NextRequest) {
  // CRITICAL: read raw body before any parsing so signature is over the exact bytes received
  const rawBody = await request.text();

  const signature = request.headers.get("x-signature");
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const meta = payload.meta as Record<string, unknown> | undefined;
  const eventName = meta?.event_name as string | undefined;

  if (!eventName || !HANDLED_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const data = payload.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;

  if (!attributes) {
    return NextResponse.json({ error: "Missing data.attributes" }, { status: 400 });
  }

  // ── Protection anti-rejeu ───────────────────────────────────────────────────
  // Lemon Squeezy ne fournit pas d'identifiant d'événement distinct (ni dans
  // `meta`, ni dans les en-têtes). On construit une clé STABLE : un même
  // événement rejoué porte le même (data.id, event_name, updated_at), donc la
  // même clé. On l'enregistre AVANT le traitement métier : l'index @unique de la
  // DB (P2002) bloque tout doublon, même si le premier traitement est en cours.
  const updatedAt = String((attributes.updated_at as string | undefined) ?? "");
  const eventId = `${String(data?.id ?? "")}-${eventName}-${updatedAt}`;

  try {
    await prisma.processedWebhookEvent.create({
      data: { eventId, eventName },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Événement déjà traité → on acquitte sans rejouer le traitement métier.
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw e; // Toute autre erreur → 500
  }

  const customData = meta?.custom_data as Record<string, unknown> | undefined;
  const orgIdFromMeta = customData?.org_id as string | undefined;
  const lsCustomerId = String(attributes.customer_id ?? "");
  const lsSubscriptionId = String(data?.id ?? "");
  const lsStatus = String(attributes.status ?? "");
  const variantId = attributes.variant_id;
  const endsAt = attributes.ends_at as string | null | undefined;

  // Lookup order: custom_data.org_id → lemonSqueezyCustomerId → email fallback
  let org = orgIdFromMeta
    ? await prisma.organization.findUnique({ where: { id: orgIdFromMeta } })
    : null;

  if (!org && lsCustomerId) {
    org = await prisma.organization.findFirst({
      where: { lemonSqueezyCustomerId: lsCustomerId },
    });
  }

  if (!org) {
    const userEmail = attributes.user_email as string | undefined;
    if (userEmail) {
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (user) {
        const membership = await prisma.membership.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        });
        if (membership) {
          org = await prisma.organization.findUnique({
            where: { id: membership.organizationId },
          });
        }
      }
    }
  }

  if (!org) {
    return NextResponse.json({ ok: true, skipped: true, reason: "org_not_found" });
  }

  const status = mapStatus(lsStatus);
  const plan: SubscriptionPlan =
    variantId != null ? mapPlan(variantId) : (org.subscriptionPlan ?? "STARTER");

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      lemonSqueezyCustomerId: lsCustomerId || org.lemonSqueezyCustomerId,
      lemonSqueezySubscriptionId: lsSubscriptionId || org.lemonSqueezySubscriptionId,
      subscriptionStatus: status,
      subscriptionPlan: plan,
      subscriptionEndsAt: endsAt ? new Date(endsAt) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
