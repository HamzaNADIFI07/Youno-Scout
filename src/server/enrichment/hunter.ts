import type { HunterContact, HunterEnrichment } from "@/lib/types";

const HUNTER_BASE = "https://api.hunter.io/v2/domain-search";

export class HunterError extends Error {
  code: "missing-key" | "quota-exceeded" | "request-failed";
  constructor(message: string, code: HunterError["code"]) {
    super(message);
    this.code = code;
    this.name = "HunterError";
  }
}

export async function fetchHunter(domain: string): Promise<HunterEnrichment> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    throw new HunterError("HUNTER_API_KEY missing on the server.", "missing-key");
  }

  const url = `${HUNTER_BASE}?domain=${encodeURIComponent(domain)}&limit=10&api_key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });

  if (response.status === 429) {
    throw new HunterError("Hunter quota exceeded.", "quota-exceeded");
  }
  if (!response.ok) {
    throw new HunterError(
      `Hunter responded with status ${response.status}.`,
      "request-failed"
    );
  }

  const json = (await response.json()) as HunterResponse;
  const data = json.data ?? {};

  const emails: HunterContact[] = (data.emails ?? []).map((entry) => ({
    email: entry.value,
    firstName: entry.first_name ?? undefined,
    lastName: entry.last_name ?? undefined,
    position: entry.position ?? undefined,
    confidence: entry.confidence ?? undefined,
    type: entry.type ?? undefined,
  }));

  return {
    domain: data.domain,
    organization: data.organization,
    pattern: data.pattern,
    totalEmailsFound: data.total ?? emails.length,
    emails,
  };
}

type HunterResponse = {
  data?: {
    domain?: string;
    organization?: string;
    pattern?: string;
    total?: number;
    emails?: Array<{
      value: string;
      first_name?: string | null;
      last_name?: string | null;
      position?: string | null;
      confidence?: number;
      type?: string;
    }>;
  };
};
