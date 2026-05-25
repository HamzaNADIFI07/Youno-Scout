import Groq from "groq-sdk";
import { DEFAULT_MODEL, MAX_TEXT_CHARS_FOR_LLM } from "@/lib/constants";
import { LlmCompanyInsightSchema, type LlmCompanyInsight } from "@/lib/types";

const TOOL_NAME = "submit_company_brief";

const SYSTEM_PROMPT = `You are a B2B sales analyst. Read the website content and produce a factual brief about the company.

Rules:
- Only state what is directly supported by the content.
- If a field cannot be determined, return a sensible default and lower the confidence.
- Keep descriptions concise and free of marketing fluff.
- Always answer in English.
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
    name: { type: "string", description: "Official company name." },
    shortDescription: {
      type: "string",
      description: "One sentence describing what the company does.",
    },
    longDescription: {
      type: "string",
      description:
        "Short paragraph (3 to 5 sentences) explaining the value proposition.",
    },
    industry: {
      type: "string",
      description:
        "Industry vertical in kebab-case (eg. fintech, devtools, hr-tech).",
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
      description: "Who they sell to, in one short sentence.",
    },
    valueProposition: {
      type: "string",
      description: "Core promise of the company in one sentence.",
    },
    pricingPublicly: {
      type: "boolean",
      description: "Whether a public pricing page or pricing info is visible.",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Confidence in the extraction quality.",
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
