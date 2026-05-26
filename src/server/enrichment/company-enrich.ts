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

  const location = [
    json.location?.city ?? json.headquarters?.city,
    json.location?.state ?? json.headquarters?.state,
    json.location?.country ?? json.headquarters?.country,
  ]
    .filter((value): value is string => Boolean(value))
    .join(", ");

  return {
    name: json.name ?? undefined,
    legalName: json.legalName ?? undefined,
    domain: json.domain ?? domain,
    description: json.description ?? json.shortDescription ?? undefined,
    industry: json.industry ?? json.category?.industry ?? undefined,
    employees: stringifyEmployees(json),
    founded: stringifyFounded(json),
    location: location || undefined,
    city: json.location?.city ?? json.headquarters?.city ?? undefined,
    country: json.location?.country ?? json.headquarters?.country ?? undefined,
    linkedinUrl: json.linkedin?.url ?? undefined,
    twitterUrl: json.twitter?.url ?? undefined,
  };
}

function stringifyEmployees(json: CompanyEnrichResponse): string | undefined {
  if (typeof json.employees === "number") return String(json.employees);
  if (typeof json.employees === "string") return json.employees;
  if (json.metrics?.employeesRange) return json.metrics.employeesRange;
  return undefined;
}

function stringifyFounded(json: CompanyEnrichResponse): string | undefined {
  if (typeof json.foundedYear === "number") return String(json.foundedYear);
  if (typeof json.foundedYear === "string") return json.foundedYear;
  if (json.founded) return String(json.founded);
  return undefined;
}

type CompanyEnrichResponse = {
  name?: string;
  legalName?: string;
  domain?: string;
  description?: string;
  shortDescription?: string;
  industry?: string;
  employees?: number | string;
  foundedYear?: number | string;
  founded?: number | string;
  metrics?: { employeesRange?: string };
  category?: { industry?: string };
  location?: { city?: string; state?: string; country?: string };
  headquarters?: { city?: string; state?: string; country?: string };
  linkedin?: { url?: string };
  twitter?: { url?: string };
};
