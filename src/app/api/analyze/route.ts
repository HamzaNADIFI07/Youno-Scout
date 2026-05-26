import { NextResponse } from "next/server";
import { requestLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { AnalyzeRequestSchema } from "@/lib/types";
import { DiscoveryError, runDiscovery } from "@/server/discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ErrorCode =
  | "invalid-url"
  | "fetch-failed"
  | "timeout"
  | "blocked"
  | "llm-failed"
  | "internal";

export async function POST(request: Request) {
  const log = requestLogger(request);

  const rate = await checkRateLimit("analyze", request);
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("invalid-url", "Requête invalide.", 400);
  }

  const parsed = AnalyzeRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(
      "invalid-url",
      "URL invalide. Vérifiez le format et réessayez.",
      400
    );
  }

  try {
    log.info(
      {
        url: parsed.data.url,
        signalCount: parsed.data.selectedSignals?.length,
        customSignalCount: parsed.data.customSignals?.length,
        enabledApis: parsed.data.enabledApis,
      },
      "analyze start"
    );
    const result = await runDiscovery(parsed.data.url, {
      selectedSignals: parsed.data.selectedSignals,
      customSignals: parsed.data.customSignals,
      enabledApis: parsed.data.enabledApis,
    });
    log.info(
      {
        durationMs: result.durationMs,
        icpScore: result.icp.total,
        icpVerdict: result.icp.verdict,
      },
      "analyze success"
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    log.error({ err: error, route: "analyze" }, "analyze failure");
    if (error instanceof DiscoveryError) {
      const { message, status } = sanitizeDiscoveryError(error.code);
      return errorResponse(error.code, message, status);
    }
    return errorResponse(
      "internal",
      "Une erreur inattendue est survenue. Réessayez dans quelques instants.",
      500
    );
  }
}

function sanitizeDiscoveryError(code: ErrorCode): {
  message: string;
  status: number;
} {
  switch (code) {
    case "invalid-url":
      return {
        message: "URL invalide. Vérifiez le format et réessayez.",
        status: 400,
      };
    case "timeout":
      return {
        message:
          "Le site cible met trop de temps à répondre. Réessayez dans quelques instants.",
        status: 504,
      };
    case "blocked":
      return {
        message:
          "Le site cible bloque l'accès automatique. Essayez avec une autre URL.",
        status: 502,
      };
    case "fetch-failed":
      return {
        message:
          "Impossible d'accéder au site cible. Vérifiez l'URL et réessayez.",
        status: 502,
      };
    case "llm-failed":
      return {
        message:
          "L'analyse IA est momentanément indisponible. Réessayez dans quelques instants.",
        status: 502,
      };
    default:
      return {
        message:
          "Une erreur inattendue est survenue. Réessayez dans quelques instants.",
        status: 500,
      };
  }
}

function errorResponse(code: ErrorCode, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error:
        "Trop de tentatives. Réessayez dans quelques minutes.",
      code: "rate-limited",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}
