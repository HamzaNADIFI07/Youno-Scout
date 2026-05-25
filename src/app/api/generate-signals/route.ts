import { NextResponse } from "next/server";
import { GenerateSignalsRequestSchema } from "@/lib/types";
import {
  SignalsGeneratorError,
  generateCustomSignals,
} from "@/server/llm/signals-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const parsed = GenerateSignalsRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues.map((i) => i.message).join("; "),
      400
    );
  }

  try {
    const signals = await generateCustomSignals(parsed.data);
    return NextResponse.json({ signals }, { status: 200 });
  } catch (error) {
    if (error instanceof SignalsGeneratorError) {
      return errorResponse(error.message, 502);
    }
    return errorResponse("Unexpected error during signal generation.", 500);
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
