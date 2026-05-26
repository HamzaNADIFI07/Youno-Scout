import type { EnabledApis, EnrichmentData } from "@/lib/types";
import { fetchClearbitLogo } from "./clearbit-logo";
import { CompanyEnrichError, fetchCompanyEnrich } from "./company-enrich";
import { HunterError, fetchHunter } from "./hunter";

type EnrichmentError = NonNullable<EnrichmentData["errors"]>[number];

export async function runEnrichments(input: {
  domain: string;
  enabledApis: EnabledApis | undefined;
}): Promise<EnrichmentData | undefined> {
  const enabled = input.enabledApis;
  if (!enabled) return undefined;

  const data: EnrichmentData = {};
  const errors: EnrichmentError[] = [];

  if (enabled.clearbitLogo) {
    try {
      const logo = await fetchClearbitLogo(input.domain);
      if (logo) data.logoUrl = logo;
    } catch (error) {
      errors.push({
        api: "clearbit-logo",
        message: error instanceof Error ? error.message : "Unknown error.",
      });
    }
  }

  if (enabled.hunter) {
    try {
      data.hunter = await fetchHunter(input.domain);
    } catch (error) {
      const message =
        error instanceof HunterError
          ? mapHunterError(error)
          : error instanceof Error
            ? error.message
            : "Unknown Hunter error.";
      errors.push({ api: "hunter", message });
    }
  }

  if (enabled.companyEnrich) {
    try {
      data.companyEnrich = await fetchCompanyEnrich(input.domain);
    } catch (error) {
      const message =
        error instanceof CompanyEnrichError
          ? mapCompanyEnrichError(error)
          : error instanceof Error
            ? error.message
            : "Unknown CompanyEnrich error.";
      errors.push({ api: "company-enrich", message });
    }
  }

  if (errors.length > 0) data.errors = errors;
  if (Object.keys(data).length === 0) return undefined;
  return data;
}

function mapHunterError(error: HunterError): string {
  switch (error.code) {
    case "missing-key":
      return "Aucune clé Hunter configurée sur le serveur.";
    case "quota-exceeded":
      return "Quota Hunter dépassé pour ce mois.";
    default:
      return error.message;
  }
}

function mapCompanyEnrichError(error: CompanyEnrichError): string {
  switch (error.code) {
    case "missing-key":
      return "Aucune clé CompanyEnrich configurée sur le serveur.";
    case "quota-exceeded":
      return "Quota CompanyEnrich dépassé.";
    case "not-found":
      return "Entreprise non trouvée dans la base CompanyEnrich.";
    default:
      return error.message;
  }
}
