import { NextResponse } from "next/server";
import { z } from "zod";
import { requestLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { AnalysisResultSchema } from "@/lib/types";
import { sendReportPdfEmail } from "@/server/pdf/email";
import { renderScoutReport, reportFileName } from "@/server/pdf/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DownloadSchema = z.object({
  delivery: z.literal("download"),
  result: AnalysisResultSchema,
});

const EmailSchema = z.object({
  delivery: z.literal("email"),
  result: AnalysisResultSchema,
  email: z.string().email("Adresse email invalide."),
});

const RequestSchema = z.discriminatedUnion("delivery", [
  DownloadSchema,
  EmailSchema,
]);

export async function POST(request: Request) {
  const log = requestLogger(request);

  // Le rate limiter n'a pas de catégorie "pdf" dédiée — on lui passe la même
  // que pour les analyses (10/h/IP). C'est cohérent : un PDF = un rapport.
  const rate = await checkRateLimit("analyze", request);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Requête invalide.", 400);
  }

  // Le rapport vient de notre propre backend mais il a transité via
  // sessionStorage côté client. Certaines APIs externes renvoient
  // explicitement `null` au lieu d'omettre la clé, ce qui casse les
  // `.optional()` Zod (qui n'acceptent que `undefined`). On normalise.
  const cleaned = stripNullDeep(payload);

  const parsed = RequestSchema.safeParse(cleaned);
  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues.map((i) => i.message).join(" "),
      400
    );
  }

  try {
    log.info(
      {
        delivery: parsed.data.delivery,
        companyName: parsed.data.result.company.name,
      },
      "pdf start"
    );

    const pdf = await renderScoutReport(parsed.data.result);
    const fileName = reportFileName(parsed.data.result);

    if (parsed.data.delivery === "email") {
      await sendReportPdfEmail({
        to: parsed.data.email.trim().toLowerCase(),
        result: parsed.data.result,
        pdfBuffer: pdf,
        fileName,
      });
      log.info(
        { delivery: "email", fileName, sizeBytes: pdf.byteLength },
        "pdf email sent"
      );
      return NextResponse.json({ ok: true });
    }

    log.info(
      { delivery: "download", fileName, sizeBytes: pdf.byteLength },
      "pdf download served"
    );

    // Retourne le PDF binaire avec les bons headers
    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    log.error({ err: error, route: "pdf" }, "pdf failure");
    return errorResponse(
      "Génération du rapport PDF impossible. Réessayez dans quelques instants.",
      502
    );
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Supprime récursivement les valeurs `null` d'un objet pour les rendre
 * équivalentes à `undefined` (que Zod `.optional()` accepte). Les
 * tableaux préservent leur ordre et leur longueur — les éléments null
 * sont remplacés par `undefined` (ce qui suffit pour les schémas qu'on
 * passe ici puisqu'on n'a pas d'arrays optionnels mélangeant null et
 * valeurs réelles).
 */
function stripNullDeep(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) {
    return value.map(stripNullDeep);
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = stripNullDeep(v);
      if (cleaned !== undefined) {
        out[k] = cleaned;
      }
    }
    return out;
  }
  return value;
}
