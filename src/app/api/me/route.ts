import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/session";
import { findSubscriberByEmail } from "@/server/subscribers/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySession(token);

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  // Vérification croisée : si l'enregistrement DB a été supprimé ou n'est plus
  // vérifié, on invalide la session.
  try {
    const subscriber = await findSubscriberByEmail(session.email);
    if (!subscriber || !subscriber.verified) {
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    logger.error({ err: error, route: "me" }, "me failure");
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    email: session.email,
  });
}
