import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requestLogger } from "@/lib/logger";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signSession,
} from "@/lib/session";
import {
  findSubscriberByToken,
  markSubscriberVerified,
} from "@/server/subscribers/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

async function setSessionCookie(
  subscriberId: string,
  email: string
): Promise<void> {
  const token = signSession({
    sid: subscriberId,
    email,
    iat: Math.floor(Date.now() / 1000),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function GET(request: Request) {
  const log = requestLogger(request);
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    log.warn({ reason: "missing-token" }, "verify rejected");
    return NextResponse.redirect(appUrl("/verified?status=invalid"));
  }

  try {
    const existing = await findSubscriberByToken(token);
    if (!existing) {
      log.warn({ reason: "unknown-token" }, "verify rejected");
      return NextResponse.redirect(appUrl("/verified?status=invalid"));
    }

    if (existing.verified) {
      await setSessionCookie(existing.id, existing.email);
      log.info(
        { subscriberId: existing.id, reverified: true },
        "verify success (cookie re-issued)"
      );
      return NextResponse.redirect(
        appUrl(`/verified?status=ok&email=${encodeURIComponent(existing.email)}`)
      );
    }

    const updated = await markSubscriberVerified(token);
    if (!updated) {
      log.warn({ reason: "update-failed" }, "verify rejected");
      return NextResponse.redirect(appUrl("/verified?status=invalid"));
    }

    await setSessionCookie(updated.id, updated.email);
    log.info({ subscriberId: updated.id }, "verify success");
    return NextResponse.redirect(
      appUrl(`/verified?status=ok&email=${encodeURIComponent(updated.email)}`)
    );
  } catch (error) {
    log.error({ err: error, route: "verify" }, "verify failure");
    return NextResponse.redirect(appUrl("/verified?status=error"));
  }
}
