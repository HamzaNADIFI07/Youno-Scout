import { logger } from "@/lib/logger";

export type LlmTask = "analyze" | "signals";

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type LlmToolChoice =
  | { type: "function"; function: { name: string } }
  | "required"
  | "auto"
  | "none";

export type LlmCallParams = {
  messages: LlmMessage[];
  tools?: LlmToolDef[];
  toolChoice?: LlmToolChoice;
  temperature?: number;
  maxTokens?: number;
};

export type LlmToolCall = {
  name: string;
  arguments: string;
};

export type LlmResponse = {
  provider: string;
  model: string;
  toolCalls: LlmToolCall[];
  content?: string;
};

type ProviderConfig = {
  name: string;
  baseURL: string;
  envVar: string;
  models: Record<LlmTask, string[]>;
  extraHeaders?: Record<string, string>;
};

const PROVIDERS: Record<string, ProviderConfig> = {
  groq: {
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    envVar: "GROQ_API_KEY",
    models: {
      analyze: ["llama-3.3-70b-versatile"],
      signals: ["llama-3.3-70b-versatile"],
    },
  },
  openrouter: {
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    envVar: "OPENROUTER_API_KEY",
    models: {
      analyze: [
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen3-next-80b-a3b-instruct:free",
        "deepseek/deepseek-v4-flash:free",
      ],
      signals: [
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen3-next-80b-a3b-instruct:free",
        "deepseek/deepseek-v4-flash:free",
      ],
    },
    extraHeaders: {
      "HTTP-Referer": "https://github.com/hamzanadifi/youno",
      "X-Title": "Scout",
    },
  },
  mistral: {
    name: "mistral",
    baseURL: "https://api.mistral.ai/v1",
    envVar: "MISTRAL_API_KEY",
    models: {
      analyze: ["mistral-large-latest", "mistral-small-latest"],
      signals: ["mistral-small-latest"],
    },
  },
  gemini: {
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    envVar: "GEMINI_API_KEY",
    models: {
      analyze: ["gemini-2.5-flash"],
      signals: ["gemini-2.5-flash"],
    },
  },
};

const TASK_CHAINS: Record<LlmTask, string[]> = {
  analyze: ["mistral", "groq", "gemini", "openrouter"],
  signals: ["groq", "mistral", "gemini", "openrouter"],
};

export class LlmProviderError extends Error {
  code:
    | "quota"
    | "auth"
    | "validation"
    | "network"
    | "no-providers"
    | "unknown";
  provider?: string;
  status?: number;

  constructor(
    message: string,
    code: LlmProviderError["code"],
    provider?: string,
    status?: number
  ) {
    super(message);
    this.code = code;
    this.provider = provider;
    this.status = status;
    this.name = "LlmProviderError";
  }
}

export async function callLlm(
  task: LlmTask,
  params: LlmCallParams
): Promise<LlmResponse> {
  const chain = TASK_CHAINS[task];
  const failures: { provider: string; error: unknown }[] = [];
  let attempted = 0;

  for (const providerName of chain) {
    const provider = PROVIDERS[providerName];
    const apiKey = process.env[provider.envVar];
    if (!apiKey) continue;
    attempted++;

    const modelList = provider.models[task];
    let providerSucceeded = false;
    let lastModelError: unknown;

    for (let i = 0; i < modelList.length; i++) {
      const model = modelList[i];
      try {
        const result = await callProvider(provider, model, apiKey, params);
        logger.info(
          {
            task,
            provider: providerName,
            model,
            fallback: attempted > 1 || i > 0,
          },
          "llm call success"
        );
        providerSucceeded = true;
        return result;
      } catch (error) {
        lastModelError = error;
        if (!isRetryable(error)) {
          throw error;
        }
        if (i < modelList.length - 1) {
          logger.warn(
            {
              task,
              provider: providerName,
              model,
              reason: describeError(error),
            },
            "llm model failed, trying next model in same provider"
          );
        }
      }
    }

    if (!providerSucceeded) {
      failures.push({ provider: providerName, error: lastModelError });
      logger.warn(
        {
          task,
          provider: providerName,
          reason: describeError(lastModelError),
        },
        "llm provider exhausted, trying next provider"
      );
    }
  }

  if (attempted === 0) {
    throw new LlmProviderError(
      "No LLM provider configured. Set at least one of GROQ_API_KEY, OPENROUTER_API_KEY, MISTRAL_API_KEY, GEMINI_API_KEY.",
      "no-providers"
    );
  }

  const last = failures[failures.length - 1];
  if (last?.error instanceof LlmProviderError) throw last.error;
  throw new LlmProviderError(
    `All LLM providers failed for task ${task}.`,
    "unknown"
  );
}

async function callProvider(
  provider: ProviderConfig,
  model: string,
  apiKey: string,
  params: LlmCallParams
): Promise<LlmResponse> {
  const body: Record<string, unknown> = {
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0.2,
  };
  if (params.maxTokens) body.max_tokens = params.maxTokens;
  if (params.tools && params.tools.length > 0) {
    body.tools = params.tools.map((tool) => ({
      ...tool,
      function: {
        ...tool.function,
        parameters: sanitizeSchemaForProvider(
          provider.name,
          tool.function.parameters
        ),
      },
    }));
    if (params.toolChoice) {
      body.tool_choice = translateToolChoice(provider.name, params.toolChoice);
    }
  }

  const url = `${provider.baseURL}/chat/completions`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(provider.extraHeaders ?? {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new LlmProviderError(
      "Network error reaching provider.",
      "network",
      provider.name
    );
  }

  if (!response.ok) {
    const status = response.status;
    const text = await response.text().catch(() => "");
    const code: LlmProviderError["code"] =
      status === 429
        ? "quota"
        : status === 401 || status === 403
          ? "auth"
          : status >= 500
            ? "network"
            : "unknown";
    logger.error(
      {
        provider: provider.name,
        status,
        body: text.slice(0, 300),
      },
      "llm provider HTTP error"
    );
    throw new LlmProviderError(
      `Provider ${provider.name} responded ${status}: ${text.slice(0, 200)}`,
      code,
      provider.name,
      status
    );
  }

  const json = (await response.json()) as ChatCompletionResponse;
  const message = json.choices?.[0]?.message;
  const toolCalls: LlmToolCall[] = (message?.tool_calls ?? [])
    .filter(
      (c) =>
        (c.type === undefined || c.type === "function") &&
        c.function &&
        typeof c.function.name === "string" &&
        typeof c.function.arguments === "string"
    )
    .map((c) => ({
      name: c.function.name,
      arguments: c.function.arguments,
    }));

  const choiceRequiresTool =
    params.toolChoice &&
    params.toolChoice !== "none" &&
    params.toolChoice !== "auto";
  if (params.tools && choiceRequiresTool && toolCalls.length === 0) {
    logger.error(
      {
        provider: provider.name,
        content: (message?.content ?? "").slice(0, 200),
      },
      "llm 200 OK but no tool call returned"
    );
    throw new LlmProviderError(
      `Provider ${provider.name} did not return the expected tool call.`,
      "validation",
      provider.name
    );
  }

  return {
    provider: provider.name,
    model,
    toolCalls,
    content: message?.content ?? undefined,
  };
}

function translateToolChoice(
  providerName: string,
  choice: LlmToolChoice
): unknown {
  if (providerName === "mistral" && choice === "required") {
    return "any";
  }
  return choice;
}

const GEMINI_UNSUPPORTED_KEYS = new Set([
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "minLength",
  "maxLength",
  "pattern",
]);

function sanitizeSchemaForProvider(
  providerName: string,
  schema: Record<string, unknown>
): Record<string, unknown> {
  if (providerName !== "gemini") return schema;
  return stripKeys(schema, GEMINI_UNSUPPORTED_KEYS) as Record<string, unknown>;
}

function stripKeys(value: unknown, blocked: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripKeys(item, blocked));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (blocked.has(key)) continue;
      out[key] = stripKeys(val, blocked);
    }
    return out;
  }
  return value;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof LlmProviderError) {
    return (
      error.code === "quota" ||
      error.code === "network" ||
      error.code === "validation" ||
      error.code === "unknown"
    );
  }
  return true;
}

function describeError(error: unknown): string {
  if (error instanceof LlmProviderError) {
    return `${error.code}/${error.status ?? "n/a"}`;
  }
  if (error instanceof Error) return error.message.slice(0, 80);
  return "unknown";
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        type?: string;
        function: { name: string; arguments: string };
      }>;
    };
  }>;
};
