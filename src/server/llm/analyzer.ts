import Groq from "groq-sdk";
import { DEFAULT_MODEL, MAX_TEXT_CHARS_FOR_LLM } from "@/lib/constants";
import { LlmCompanyInsightSchema, type LlmCompanyInsight } from "@/lib/types";

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
  constructor(message: string) {
    super(message);
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
      description:
        "À qui ils vendent, en une phrase courte en français.",
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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new LlmError("GROQ_API_KEY environment variable is missing.");
  }

  const client = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL ?? DEFAULT_MODEL;

  const userMessage = buildUserMessage(input);

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 1500,
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
      tool_choice: {
        type: "function",
        function: { name: TOOL_NAME },
      },
    });

    const message = response.choices[0]?.message;
    const toolCall = message?.tool_calls?.[0];

    if (!toolCall || toolCall.type !== "function") {
      throw new LlmError("LLM did not return a structured brief.");
    }

    let rawArgs: unknown;
    try {
      rawArgs = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new LlmError("LLM returned malformed JSON.");
    }

    const parsed = LlmCompanyInsightSchema.safeParse(rawArgs);
    if (!parsed.success) {
      throw new LlmError(
        `LLM response failed validation: ${parsed.error.issues
          .map((i) => i.message)
          .join("; ")}`
      );
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (error instanceof Groq.APIError) {
      throw new LlmError(`Groq API error: ${error.message}`);
    }
    throw new LlmError(
      error instanceof Error ? error.message : "Unknown LLM error."
    );
  }
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
