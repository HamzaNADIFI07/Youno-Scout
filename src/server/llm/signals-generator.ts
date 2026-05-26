import {
  CustomSignalSchema,
  type CustomSignal,
  type CustomSignalCategory,
} from "@/lib/types";
import { LlmProviderError, callLlm } from "@/server/llm/providers";

const TOOL_NAME = "submit_signals";
const REJECT_TOOL_NAME = "report_invalid_input";

const SYSTEM_PROMPT = `You are a senior B2B Go-To-Market expert helping a sales team qualify prospect companies.

CONTEXT
- The USER is the seller. They describe their company, their product, AND the profile of the prospects they want to target (their ICP).
- The TARGET is the prospect company whose website will be analysed.
- Your job: generate GTM signals that QUALIFY THE PROSPECT, based on what can be found on the PROSPECT'S website.

ABSOLUTE RULES
1. Every signal describes a CHARACTERISTIC OF THE PROSPECT (target company), not of the user (seller).
2. Labels MUST use the standard B2B prospecting NOUN-PHRASE form (industry standard — same style as Clearbit, Apollo, Cognism, Lemlist). NEVER use "Je", "J'ai", "Mon", "Mes", "Nous". NEVER use full sentences. Write the observable characteristic directly, telegraphic and action-oriented. Max ~10 words.
   - GOOD : "Plusieurs clients payants et produit lancé", "Recrute Head of RevOps", "Utilise HubSpot", "Levée Series A récente", "Pricing public visible", "Équipe de 5 à 80 personnes", "Pas de version mobile", "Stack: Salesforce + Outreach", "Présence en France", "Blog actif sur le RevOps"
   - BAD (first person) : "Je recrute un Head of RevOps", "J'utilise déjà HubSpot", "J'ai plusieurs clients payants"
   - BAD (full sentences) : "Le prospect correspond à...", "L'entreprise utilise..."
   - BAD (seller perspective) : "Notre cible", "Nos clients idéaux"
   - BAD (compound with multiple "ou") : "Recrute un Head of Sales ou Head of Growth ou un VP Sales" — pick ONE specific thing per signal, or generate two separate signals.
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

INPUT QUALITY CHECK
Before generating signals, evaluate whether the user input contains enough exploitable information :
- "Generate from scratch" mode : the description must include at least a hint of WHAT the user sells AND WHO they target. Pure gibberish ("asdfasdf"), filler text, single vague sentences ("je vends des trucs aux boîtes"), or descriptions with zero specifics are NOT usable.
- "Modify list" mode : the instruction must be understandable and actionable in the context of the existing list (eg. "remove the funding signal", "add a Notion detection"). Random text, off-topic requests, or unintelligible instructions are NOT usable.
- If the input is unusable, call the report_invalid_input tool with a short French reason explaining what is missing (eg. "L'offre n'est pas décrite", "L'ICP cible n'est pas précisé", "L'instruction n'est pas compréhensible"). Do NOT call submit_signals in that case.
- When in doubt, prefer calling submit_signals with the best signals you can derive — only reject when the input is genuinely unusable.

If the input is usable, call submit_signals with the final list. Never output free text.`;

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
            description:
              "One of: joignabilite, maturite, croissance, produit, fit. Use the closest match; the server will normalize it.",
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

const REJECT_SCHEMA = {
  type: "object",
  properties: {
    reason: {
      type: "string",
      description:
        "Short French reason (5-25 words) explaining what is missing from the user input — eg. 'L'offre n'est pas décrite', 'L'ICP cible n'est pas précisé', 'L'instruction est incompréhensible'.",
    },
  },
  required: ["reason"],
};

export class SignalsGeneratorError extends Error {
  reason?: string;
  constructor(message: string, reason?: string) {
    super(message);
    this.reason = reason;
    this.name = "SignalsGeneratorError";
  }
}

export async function generateCustomSignals(input: {
  description: string;
  targetUrl?: string;
  currentSignals?: CustomSignal[];
  instruction?: string;
}): Promise<CustomSignal[]> {
  const userMessage = buildUserMessage(input);

  let response;
  try {
    response = await callLlm("signals", {
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
              "Submit the final list of custom GTM signals tailored to the user's ICP. Only call this if the user input is usable.",
            parameters: INPUT_SCHEMA,
          },
        },
        {
          type: "function",
          function: {
            name: REJECT_TOOL_NAME,
            description:
              "Reject the request when the user input is gibberish, too vague, or unintelligible. Provide a short French reason. Call this INSTEAD of submit_signals — never call both.",
            parameters: REJECT_SCHEMA,
          },
        },
      ],
      toolChoice: "required",
      temperature: 0.3,
      maxTokens: 2000,
    });
  } catch (error) {
    if (error instanceof LlmProviderError) {
      if (error.code === "no-providers") {
        throw new SignalsGeneratorError("no-providers");
      }
      if (error.code === "quota") {
        throw new SignalsGeneratorError("quota-exceeded");
      }
      throw new SignalsGeneratorError("llm-failed");
    }
    throw new SignalsGeneratorError("llm-failed");
  }

  const toolCall = response.toolCalls[0];
  if (!toolCall) {
    throw new SignalsGeneratorError("invalid-output");
  }

  let rawArgs: unknown;
  try {
    rawArgs = JSON.parse(toolCall.arguments);
  } catch {
    throw new SignalsGeneratorError("invalid-output");
  }

  if (toolCall.name === REJECT_TOOL_NAME) {
    const reason =
      typeof (rawArgs as { reason?: unknown })?.reason === "string"
        ? ((rawArgs as { reason: string }).reason.trim() || undefined)
        : undefined;
    throw new SignalsGeneratorError("unintelligible-input", reason);
  }

  if (toolCall.name !== TOOL_NAME) {
    throw new SignalsGeneratorError("invalid-output");
  }

  const args = rawArgs as { signals?: unknown };
  if (!Array.isArray(args.signals)) {
    throw new SignalsGeneratorError("invalid-output");
  }

  const parsed: CustomSignal[] = [];
  for (const item of args.signals) {
    const raw = item as Record<string, unknown>;
    const normalizedCategory = normalizeCategory(raw.category);
    if (!normalizedCategory) continue;
    const candidate = {
      ...raw,
      category: normalizedCategory,
      id: generateId(),
    };
    const validation = CustomSignalSchema.safeParse(candidate);
    if (validation.success) {
      parsed.push(normalizeSignal(validation.data));
    }
  }

  if (parsed.length < 4) {
    throw new SignalsGeneratorError("invalid-output");
  }

  return parsed;
}

const CATEGORY_ALIASES: Record<string, CustomSignalCategory> = {
  joignabilite: "joignabilite",
  joignabilité: "joignabilite",
  contact: "joignabilite",
  contactabilite: "joignabilite",
  reachability: "joignabilite",
  maturite: "maturite",
  maturité: "maturite",
  maturity: "maturite",
  enterprise: "maturite",
  compliance: "maturite",
  brand: "maturite",
  croissance: "croissance",
  growth: "croissance",
  hiring: "croissance",
  funding: "croissance",
  expansion: "croissance",
  intent: "croissance",
  produit: "produit",
  product: "produit",
  tech: "produit",
  technology: "produit",
  stack: "produit",
  "culture tech": "produit",
  integrations: "produit",
  fit: "fit",
  icp: "fit",
  size: "fit",
  industry: "fit",
  geography: "fit",
  segment: "fit",
};

function normalizeCategory(value: unknown): CustomSignalCategory | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key) return null;
  const direct = CATEGORY_ALIASES[key];
  if (direct) return direct;
  for (const alias of Object.keys(CATEGORY_ALIASES)) {
    if (key.includes(alias)) return CATEGORY_ALIASES[alias];
  }
  return null;
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
