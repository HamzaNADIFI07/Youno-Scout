import { NextResponse } from "next/server";
import { z } from "zod";
import { requestLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { upsertSubscriber } from "@/server/subscribers/store";
import { sendVerificationEmail } from "@/server/subscribers/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  email: z.string().email("Email invalide."),
  acceptedMarketing: z.boolean(),
  acceptedTerms: z
    .boolean()
    .refine((v) => v === true, {
      message: "Vous devez accepter les conditions d'utilisation.",
    }),
});

export async function POST(request: Request) {
  const log = requestLogger(request);

  const rate = await checkRateLimit("subscribe", request);
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Requête invalide.", 400);
  }

  const parsed = RequestSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues.map((i) => i.message).join(" "),
      400
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined;

    const subscriber = await upsertSubscriber({
      email,
      acceptedMarketing: parsed.data.acceptedMarketing,
      acceptedTerms: parsed.data.acceptedTerms,
      ipAddress,
    });

    // On envoie toujours un email, même si l'adresse a déjà été vérifiée
    // sur un autre navigateur : c'est en cliquant sur le lien que le cookie
    // de session est posé sur le navigateur courant.
    await sendVerificationEmail({
      to: subscriber.email,
      verificationToken: subscriber.verificationToken,
    });

    log.info(
      { subscriberId: subscriber.id, alreadyVerified: subscriber.verified },
      "subscribe success"
    );
    return NextResponse.json({ status: "pending" }, { status: 200 });
  } catch (error) {
    log.error({ err: error, route: "subscribe" }, "subscribe failure");
    return errorResponse(
      "L'envoi de l'email de confirmation a échoué. Réessayez dans quelques instants.",
      502
    );
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error:
        "Vous avez demandé un email récemment. Patientez avant de retenter.",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}
