import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Génère et propage un identifiant unique de requête (x-request-id) pour
 * permettre la corrélation des logs serveur d'une même requête.
 *
 * - Si le client envoie déjà un x-request-id (proxy / tests), on le respecte.
 * - Sinon on en génère un avec crypto.randomUUID().
 * - L'ID est injecté dans les headers de la requête (lisible côté route) ET
 *   dans les headers de la réponse (lisible côté client / monitoring).
 */
export function middleware(request: NextRequest) {
  const incoming = request.headers.get("x-request-id");
  const requestId = incoming && incoming.length > 0 ? incoming : crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-request-id", requestId);
  return response;
}

// Limite le middleware aux routes API : on ne pollue pas le rendu HTML.
export const config = {
  matcher: ["/api/:path*"],
};
