import { NextResponse } from "next/server";
import { AnalyzeRequestSchema } from "@/lib/types";
import { DiscoveryError, runDiscovery } from "@/server/discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("invalid-url", "Request body must be valid JSON.", 400);
  }

  const parsed = AnalyzeRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(
      "invalid-url",
      parsed.error.issues.map((i) => i.message).join("; "),
      400
    );
  }

  try {
    const result = await runDiscovery(parsed.data.url);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof DiscoveryError) {
      const status = statusForCode(error.code);
      return errorResponse(error.code, error.message, status);
    }
    return errorResponse(
      "internal",
      "Unexpected error during analysis.",
      500
    );
  }
}

type ErrorCode =
  | "invalid-url"
  | "fetch-failed"
  | "timeout"
  | "blocked"
  | "llm-failed"
  | "internal";

function errorResponse(code: ErrorCode, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

function statusForCode(code: ErrorCode): number {
  switch (code) {
    case "invalid-url":
      return 400;
    case "blocked":
      return 502;
    case "timeout":
      return 504;
    case "fetch-failed":
      return 502;
    case "llm-failed":
      return 502;
    default:
      return 500;
  }
}
