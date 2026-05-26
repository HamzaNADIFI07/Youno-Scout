import { MAX_TEXT_CHARS_FOR_LLM } from "@/lib/constants";
import { LlmCompanyInsightSchema, type LlmCompanyInsight } from "@/lib/types";
import { LlmProviderError, callLlm } from "@/server/llm/providers";

const TOOL_NAME = "submit_company_brief";

const SYSTEM_PROMPT = `You are a B2B sales analyst. Read the website content and produce a factual brief about the company.

Rules:
- Only state what is directly supported by the content.
- If a field cannot be determined, return a sensible default and lower the confidence.
- Keep descriptions concise and free of marketing fluff.
- Toujours répondre en français, peu importe la langue du site analysé. Traduire si nécessaire.
- L'industrie doit être un terme français en minuscules avec tirets (ex. "fintech", "outils-marketing", "logiciel-rh", "e-commerce").
- Pour le champ "people" : extrait UNIQUEMENT les personnes explicitement nommées sur la page (prénom + nom complet). Mentionne fondateurs, dirigeants, équipe affichée, témoignages clients avec leur nom et fonction. Si aucune personne n'est nommée, retourne un tableau vide.
- Always call the submit_company_brief function with your final answer.`;

export class LlmError extends Error {
  code:
    | "quota-exceeded"
    | "no-providers"
    | "invalid-output"
    | "llm-failed";

  constructor(message: string, code: LlmError["code"] = "llm-failed") {
    super(message);
    this.code = code;
    this.name = "LlmError";
  }
}

const INPUT_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "Nom officiel de l'entreprise." },
    shortDescription: {
      type: "string",
      description:
        "Une phrase en français décrivant ce que fait l'entreprise.",
    },
    longDescription: {
      type: "string",
      description:
        "Paragraphe court en français (3 à 5 phrases) expliquant la proposition de valeur.",
    },
    industry: {
      type: "string",
      description:
        "Secteur d'activité en français, kebab-case minuscule (ex : fintech, outils-marketing, logiciel-rh, e-commerce).",
    },
    businessModel: {
      type: "string",
      enum: ["b2b", "b2c", "b2b2c", "marketplace", "unknown"],
    },
    estimatedSize: {
      type: "string",
      enum: ["startup", "smb", "mid-market", "enterprise", "unknown"],
    },
    targetAudience: {
      type: "string",
      description: "À qui ils vendent, en une phrase courte en français.",
    },
    valueProposition: {
      type: "string",
      description:
        "Promesse principale de l'entreprise en une phrase en français.",
    },
    pricingPublicly: {
      type: "boolean",
      description:
        "True si une page de tarifs publique ou des prix visibles existent sur le site.",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "Confiance dans la qualité d'extraction, de 0 (très faible) à 1 (très élevée).",
    },
    people: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        properties: {
          fullName: {
            type: "string",
            description:
              "Nom complet de la personne (prénom + nom) telle qu'elle apparaît sur la page.",
          },
          role: {
            type: "string",
            description:
              "Fonction ou rôle si mentionné (ex. : CEO, Co-fondateur, Head of Sales). Optionnel.",
          },
        },
        required: ["fullName"],
      },
      description:
        "Personnes explicitement nommées sur la page (fondateurs, équipe, témoignages clients). Retourne un tableau vide si aucune personne identifiée.",
    },
  },
  required: [
    "name",
    "shortDescription",
    "longDescription",
    "industry",
    "businessModel",
    "estimatedSize",
    "targetAudience",
    "valueProposition",
    "pricingPublicly",
    "confidence",
    "people",
  ],
};

export async function analyzeWithLlm(input: {
  url: string;
  title?: string;
  description?: string;
  mainText: string;
}): Promise<LlmCompanyInsight> {
  const userMessage = buildUserMessage(input);

  let response;
  try {
    response = await callLlm("analyze", {
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
              "Submit a structured company brief based on the website content.",
            parameters: INPUT_SCHEMA,
          },
        },
      ],
      toolChoice: { type: "function", function: { name: TOOL_NAME } },
      temperature: 0,
      maxTokens: 1500,
    });
  } catch (error) {
    if (error instanceof LlmProviderError) {
      if (error.code === "no-providers") {
        throw new LlmError("no-providers", "no-providers");
      }
      if (error.code === "quota") {
        throw new LlmError("quota-exceeded", "quota-exceeded");
      }
      throw new LlmError("llm-failed", "llm-failed");
    }
    throw new LlmError("llm-failed", "llm-failed");
  }

  const toolCall = response.toolCalls[0];
  if (!toolCall) {
    throw new LlmError("invalid-output", "invalid-output");
  }

  let rawArgs: unknown;
  try {
    rawArgs = JSON.parse(toolCall.arguments);
  } catch {
    throw new LlmError("invalid-output", "invalid-output");
  }

  const parsed = LlmCompanyInsightSchema.safeParse(rawArgs);
  if (!parsed.success) {
    throw new LlmError("invalid-output", "invalid-output");
  }

  return parsed.data;
}

function buildUserMessage(input: {
  url: string;
  title?: string;
  description?: string;
  mainText: string;
}): string {
  const truncated = input.mainText.slice(0, MAX_TEXT_CHARS_FOR_LLM);
  const lines = [
    `URL: ${input.url}`,
    input.title ? `Page title: ${input.title}` : null,
    input.description ? `Meta description: ${input.description}` : null,
    "",
    "Website content (truncated):",
    truncated,
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}
