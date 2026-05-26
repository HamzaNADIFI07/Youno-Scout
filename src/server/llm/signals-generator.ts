import Groq from "groq-sdk";
import { DEFAULT_MODEL } from "@/lib/constants";
import {
  CustomSignalSchema,
  type CustomSignal,
  type CustomSignalCategory,
} from "@/lib/types";

const TOOL_NAME = "submit_signals";

const SYSTEM_PROMPT = `You are a senior B2B Go-To-Market expert helping a sales team qualify prospect companies.

CONTEXT
- The USER is the seller. They describe their company, their product, AND the profile of the prospects they want to target (their ICP).
- The TARGET is the prospect company whose website will be analysed.
- Your job: generate GTM signals that QUALIFY THE PROSPECT, based on what can be found on the PROSPECT'S website.

ABSOLUTE RULES
1. Every signal describes a CHARACTERISTIC OF THE PROSPECT (target company), not of the user (seller).
2. Labels must be PHRASED FROM THE PROSPECT'S PERSPECTIVE in French, action-oriented :
   - GOOD : "Recrute un Head of RevOps", "Utilise déjà HubSpot", "Vient de lever en Series A"
   - BAD : "Notre cible", "Nos clients idéaux", "Entreprise intéressée par nos outils"
3. The RATIONALE must follow the format : "[Caractéristique observable chez le prospect] → [pourquoi cela en fait un bon prospect pour l'offre de l'utilisateur]". NEVER say "intéressée par nos outils" — that's marketing fluff, not a rationale.
4. Each signal MUST be detectable from public website HTML : text content + URL paths only.
5. Mix keyword detection (mots-clés) and url-pattern detection (paths).
6. Categories must match the signal type :
   - "fit" : the prospect matches a key ICP criterion (right size, right industry, right stack)
   - "croissance" : prospect shows growth / buying intent signals (hiring, funding, expansion)
   - "maturite" : prospect is mature enough to buy (cases studies, compliance, established team)
   - "produit" : prospect's product profile matches (uses target tools, has API, exposes integrations)
   - "joignabilite" : prospect is reachable (contact form, demo CTA, sales team visible)
   Do NOT use "joignabilite" for things like "presence in Europe" — that is "fit".
7. Weights 1-10 :
   - 9-10 : strong buy signals (active hiring of the target persona, recent funding, specific tool match)
   - 5-8 : medium signals (matching size, geographic fit, content marketing maturity)
   - 1-4 : weak context signals
8. If the user provides ANTI-SIGNALS (who is NOT their target), use them to REFINE the signals : avoid generating signals that match anti-targets, and bias signals toward exclusionary criteria when relevant.
9. Generate 8 to 12 signals.

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

  lines.push("# Seller context (in French)");
  lines.push(
    "Below is the description provided by the user (the SELLER). They describe their own company AND the profile of prospects they want to target. Use this to build signals that QUALIFY the PROSPECT — not signals that describe the seller."
  );
  lines.push("");
  lines.push(input.description.trim());

  if (input.targetUrl) {
    lines.push("");
    lines.push(
      `Example prospect URL the seller will analyse next: ${input.targetUrl}. Tailor signals so they can plausibly be detected on similar prospect websites.`
    );
  }

  if (input.currentSignals && input.currentSignals.length > 0) {
    lines.push("");
    lines.push("# Existing signals to revise");
    lines.push(JSON.stringify(stripIds(input.currentSignals), null, 2));
  }

  if (input.instruction) {
    lines.push("");
    lines.push("# User instruction (natural language)");
    lines.push(input.instruction.trim());
    lines.push("");
    lines.push(
      "Update the list to reflect this instruction. Keep stable signals when possible. Return the FULL updated list."
    );
  } else {
    lines.push("");
    lines.push(
      "Generate a fresh list of 8 to 12 signals that, when found on a prospect website, indicate the prospect matches the seller's ICP. Each signal label must describe a characteristic of the PROSPECT, not of the seller."
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
