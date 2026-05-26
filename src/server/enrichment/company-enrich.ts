import type { CompanyEnrichment } from "@/lib/types";

const ENDPOINT = "https://api.companyenrich.com/companies/enrich";

export class CompanyEnrichError extends Error {
  code: "missing-key" | "quota-exceeded" | "request-failed" | "not-found";
  constructor(message: string, code: CompanyEnrichError["code"]) {
    super(message);
    this.code = code;
    this.name = "CompanyEnrichError";
  }
}

export async function fetchCompanyEnrich(
  domain: string
): Promise<CompanyEnrichment> {
  const apiKey = process.env.COMPANY_ENRICH_API_KEY;
  if (!apiKey) {
    throw new CompanyEnrichError(
      "COMPANY_ENRICH_API_KEY missing on the server.",
      "missing-key"
    );
  }

  const url = `${ENDPOINT}?domain=${encodeURIComponent(domain)}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
    },
  });

  if (response.status === 404) {
    throw new CompanyEnrichError("Company not found.", "not-found");
  }
  if (response.status === 429) {
    throw new CompanyEnrichError("CompanyEnrich quota exceeded.", "quota-exceeded");
  }
  if (!response.ok) {
    throw new CompanyEnrichError(
      `CompanyEnrich responded with status ${response.status}.`,
      "request-failed"
    );
  }

  const json = (await response.json()) as CompanyEnrichResponse;

  const city = extractName(json.location?.city ?? json.headquarters?.city);
  const state = extractName(json.location?.state ?? json.headquarters?.state);
  const country = extractName(
    json.location?.country ?? json.headquarters?.country
  );

  const location = [city, state, country]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(", ");

  return {
    name: extractString(json.name),
    legalName: extractString(json.legalName),
    domain: extractString(json.domain) ?? domain,
    description: extractString(json.description ?? json.shortDescription),
    industry: extractString(json.industry ?? json.category?.industry),
    employees: stringifyEmployees(json),
    founded: stringifyFounded(json),
    location: location || undefined,
    city,
    country,
    linkedinUrl: extractString(json.linkedin?.url),
    twitterUrl: extractString(json.twitter?.url),
  };
}

function extractString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function extractName(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return (
      extractString(obj.name) ??
      extractString(obj.label) ??
      extractString(obj.code) ??
      undefined
    );
  }
  return undefined;
}

function stringifyEmployees(json: CompanyEnrichResponse): string | undefined {
  if (typeof json.employees === "number") return String(json.employees);
  if (typeof json.employees === "string" && json.employees.trim().length > 0)
    return json.employees.trim();
  const range = extractString(json.metrics?.employeesRange);
  if (range) return range;
  return undefined;
}

function stringifyFounded(json: CompanyEnrichResponse): string | undefined {
  if (typeof json.foundedYear === "number") return String(json.foundedYear);
  if (typeof json.foundedYear === "string" && json.foundedYear.trim().length > 0)
    return json.foundedYear.trim();
  if (typeof json.founded === "number") return String(json.founded);
  if (typeof json.founded === "string" && json.founded.trim().length > 0)
    return json.founded.trim();
  return undefined;
}

type LocationValue = unknown;

type CompanyEnrichResponse = {
  name?: unknown;
  legalName?: unknown;
  domain?: unknown;
  description?: unknown;
  shortDescription?: unknown;
  industry?: unknown;
  employees?: number | string | null;
  foundedYear?: number | string | null;
  founded?: number | string | null;
  metrics?: { employeesRange?: unknown };
  category?: { industry?: unknown };
  location?: {
    city?: LocationValue;
    state?: LocationValue;
    country?: LocationValue;
  };
  headquarters?: {
    city?: LocationValue;
    state?: LocationValue;
    country?: LocationValue;
  };
  linkedin?: { url?: unknown };
  twitter?: { url?: unknown };
};
