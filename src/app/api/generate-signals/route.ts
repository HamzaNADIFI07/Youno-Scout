import { NextResponse } from "next/server";
import { requestLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { GenerateSignalsRequestSchema } from "@/lib/types";
import {
  SignalsGeneratorError,
  generateCustomSignals,
} from "@/server/llm/signals-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const log = requestLogger(request);

  const rate = await checkRateLimit("generate-signals", request);
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Requête invalide.", 400);
  }

  const parsed = GenerateSignalsRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(
      "Décrivez votre activité avec un peu plus de détails (minimum 30 caractères).",
      400
    );
  }

  try {
    log.info(
      {
        descriptionLength: parsed.data.description.length,
        hasInstruction: Boolean(parsed.data.instruction),
        currentSignalCount: parsed.data.currentSignals?.length ?? 0,
      },
      "generate-signals start"
    );
    const signals = await generateCustomSignals(parsed.data);
    log.info({ count: signals.length }, "generate-signals success");
    return NextResponse.json({ signals }, { status: 200 });
  } catch (error) {
    log.error({ err: error, route: "generate-signals" }, "generate-signals failure");
    if (error instanceof SignalsGeneratorError) {
      const { message, status } = sanitizeSignalsError(
        error.message,
        error.reason
      );
      return errorResponse(message, status);
    }
    return errorResponse(
      "Une erreur inattendue est survenue. Réessayez dans quelques instants.",
      500
    );
  }
}

function sanitizeSignalsError(
  code: string,
  reason?: string
): { message: string; status: number } {
  switch (code) {
    case "no-providers":
      return {
        message:
          "Aucun fournisseur IA n'est configuré côté serveur. Ajoutez au moins une clé API.",
        status: 503,
      };
    case "quota-exceeded":
      return {
        message:
          "Tous les fournisseurs IA ont atteint leur quota. Patientez quelques minutes avant de relancer la génération.",
        status: 429,
      };
    case "unintelligible-input": {
      const base =
        "Votre description ne contient pas assez d'informations exploitables pour générer des signaux pertinents. Précisez votre offre, votre ICP cible et les signaux d'achat que vous cherchez à détecter.";
      return {
        message: reason ? `${base} (${reason})` : base,
        status: 422,
      };
    }
    case "invalid-output":
      return {
        message:
          "L'IA n'a pas réussi à structurer une liste complète. Reformulez votre description et réessayez.",
        status: 502,
      };
    case "llm-failed":
      return {
        message:
          "Le service de génération est momentanément indisponible. Réessayez dans quelques instants.",
        status: 502,
      };
    default:
      return {
        message:
          "La génération des signaux a échoué. Réessayez dans quelques instants.",
        status: 502,
      };
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: "Trop de tentatives. Réessayez dans quelques minutes.",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}
