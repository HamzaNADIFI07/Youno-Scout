import Groq from "groq-sdk";
import { DEFAULT_MODEL } from "@/lib/constants";
import {
  CustomSignalSchema,
  type CustomSignal,
  type CustomSignalCategory,
} from "@/lib/types";

const TOOL_NAME = "submit_signals";

const SYSTEM_PROMPT = `You are a senior B2B Go-To-Market expert helping a sales team build a custom prospect-scoring model.

Your job: given a description of the user's company, product and Ideal Customer Profile (ICP), produce 8 to 12 highly specific GTM signals that, when found on a prospect's website, indicate that the prospect is a strong fit for the user's offering.

Rules:
- Each signal MUST be concrete and detectable from public website HTML (text + URL paths).
- Mix two detection mechanisms: keywords found in the page text AND URL path patterns.
- Prioritize signals that show INTENT TO BUY (growth, hiring, expansion, fundraising, modernization) or strong fit with the user's ICP.
- Avoid generic signals such as "has a website" or "uses HTTPS".
- Use 1-10 weights: weight 9-10 for strong buying-intent signals, 5-8 for medium, 1-4 for weaker context.
- Keep labels short, in French, action-oriented (eg. "Boîte en hyper-croissance", "Présence européenne", "Stack data moderne").
- Rationale must explain WHY this signal matters for THIS user's prospection (in French, one sentence).
- Categories: "joignabilite", "maturite", "croissance", "produit", "fit".

If the user provides an existing list of signals and an instruction (eg. "remove X", "add Y"), return the UPDATED list reflecting their instruction. Otherwise, generate a fresh list.

Always call the submit_signals tool with the final list. Never output free text.`;

const INPUT_SCHEMA = {
  type: "object",
  properties: {
    signals: {
      type: "array",
      minItems: 6,
      maxItems: 12,
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "Short French label, action-oriented.",
          },
          category: {
            type: "string",
            enum: ["joignabilite", "maturite", "croissance", "produit", "fit"],
          },
          weight: {
            type: "number",
            minimum: 1,
            maximum: 10,
          },
          detection: {
            type: "object",
            properties: {
              keywords: {
                type: "array",
                maxItems: 12,
                items: { type: "string" },
                description: "Keywords or short phrases to look for in the page text.",
              },
              urlPatterns: {
                type: "array",
                maxItems: 8,
                items: { type: "string" },
                description:
                  "URL path fragments to match in internal links (eg. '/pricing', '/careers').",
              },
            },
            required: ["keywords", "urlPatterns"],
          },
          rationale: {
            type: "string",
            description: "Why this signal matters for the user's prospection, in French.",
          },
        },
        required: ["label", "category", "weight", "detection", "rationale"],
      },
    },
  },
  required: ["signals"],
};

export class SignalsGeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SignalsGeneratorError";
  }
}

export async function generateCustomSignals(input: {
  description: string;
  targetUrl?: string;
  currentSignals?: CustomSignal[];
  instruction?: string;
}): Promise<CustomSignal[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new SignalsGeneratorError("GROQ_API_KEY missing on the server.");
  }

  const client = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL ?? DEFAULT_MODEL;
  const userMessage = buildUserMessage(input);

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: TOOL_NAME,
            description:
              "Submit the final list of custom GTM signals tailored to the user's ICP.",
            parameters: INPUT_SCHEMA,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: TOOL_NAME } },
    });

    const message = response.choices[0]?.message;
    const toolCall = message?.tool_calls?.[0];

    if (!toolCall || toolCall.type !== "function") {
      throw new SignalsGeneratorError("LLM did not return a structured payload.");
    }

    let rawArgs: unknown;
    try {
      rawArgs = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new SignalsGeneratorError("LLM returned malformed JSON.");
    }

    const args = rawArgs as { signals?: unknown };
    if (!Array.isArray(args.signals)) {
      throw new SignalsGeneratorError("LLM response missing the signals array.");
    }

    const parsed: CustomSignal[] = [];
    for (const item of args.signals) {
      const withId = { ...(item as object), id: generateId() };
      const validation = CustomSignalSchema.safeParse(withId);
      if (validation.success) {
        parsed.push(normalizeSignal(validation.data));
      }
    }

    if (parsed.length < 4) {
      throw new SignalsGeneratorError(
        "LLM returned too few valid signals. Please try again."
      );
    }

    return parsed;
  } catch (error) {
    if (error instanceof SignalsGeneratorError) throw error;
    if (error instanceof Groq.APIError) {
      throw new SignalsGeneratorError(`Groq API error: ${error.message}`);
    }
    throw new SignalsGeneratorError(
      error instanceof Error ? error.message : "Unknown LLM error."
    );
  }
}

function buildUserMessage(input: {
  description: string;
  targetUrl?: string;
  currentSignals?: CustomSignal[];
  instruction?: string;
}): string {
  const lines: string[] = [];

  lines.push("# Business description (français)");
  lines.push(input.description.trim());

  if (input.targetUrl) {
    lines.push("");
    lines.push(`Target prospect URL: ${input.targetUrl}`);
  }

  if (input.currentSignals && input.currentSignals.length > 0) {
    lines.push("");
    lines.push("# Existing signals");
    lines.push(JSON.stringify(stripIds(input.currentSignals), null, 2));
  }

  if (input.instruction) {
    lines.push("");
    lines.push("# User instruction (french natural language)");
    lines.push(input.instruction.trim());
    lines.push("");
    lines.push(
      "Update the list to reflect this instruction. Keep IDs stable when possible. Return the FULL updated list."
    );
  } else {
    lines.push("");
    lines.push(
      "Generate a fresh list of 8 to 12 signals tailored to the description above."
    );
  }

  return lines.join("\n");
}

function stripIds(signals: CustomSignal[]) {
  return signals.map((signal) => {
    const { id, ...rest } = signal;
    void id;
    return rest;
  });
}

function normalizeSignal(signal: CustomSignal): CustomSignal {
  return {
    ...signal,
    label: signal.label.trim(),
    rationale: signal.rationale.trim(),
    category: signal.category as CustomSignalCategory,
    detection: {
      keywords: dedupe(signal.detection.keywords.map((k) => k.trim().toLowerCase())).filter(
        (k) => k.length > 0
      ),
      urlPatterns: dedupe(
        signal.detection.urlPatterns.map((p) => p.trim().toLowerCase())
      ).filter((p) => p.length > 0),
    },
  };
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function generateId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return `sig_${stamp}_${random}`;
}
