import type {
  AnalysisResult,
  Contacts,
  CustomSignal,
  EnabledApis,
  EnrichmentData,
  LegalInfo,
  Person,
  SignalId,
} from "@/lib/types";
import { FetchError, fetchPage, normalizeUrl } from "@/server/scraping/fetcher";
import { extractPage } from "@/server/scraping/extractor";
import { extractContacts } from "@/server/scraping/contacts";
import { detectTechStack } from "@/server/scraping/tech-stack";
import { detectSignals } from "@/server/scraping/signals";
import { detectCustomSignals } from "@/server/scraping/custom-signals";
import {
  extractLegalInfo,
  findLegalLinksFromActionable,
  findLegalPagePaths,
} from "@/server/scraping/legal-extractor";
import { runEnrichments } from "@/server/enrichment";
import { LlmError, analyzeWithLlm } from "@/server/llm/analyzer";
import { scoreIcp } from "@/server/scoring/icp-scorer";

export class DiscoveryError extends Error {
  code:
    | "invalid-url"
    | "fetch-failed"
    | "timeout"
    | "blocked"
    | "llm-failed"
    | "internal";

  constructor(message: string, code: DiscoveryError["code"]) {
    super(message);
    this.code = code;
    this.name = "DiscoveryError";
  }
}

type DiscoveryOptions = {
  selectedSignals?: SignalId[];
  customSignals?: CustomSignal[];
  enabledApis?: EnabledApis;
};

export async function runDiscovery(
  rawUrl: string,
  options: DiscoveryOptions = {}
): Promise<AnalysisResult> {
  const startedAt = Date.now();

  let url: string;
  try {
    url = normalizeUrl(rawUrl);
  } catch (error) {
    throw new DiscoveryError(
      error instanceof Error ? error.message : "Invalid URL.",
      "invalid-url"
    );
  }

  let fetched;
  try {
    fetched = await fetchPage(url);
  } catch (error) {
    if (error instanceof FetchError) {
      throw new DiscoveryError(error.message, error.code);
    }
    throw new DiscoveryError("Unable to fetch the website.", "fetch-failed");
  }

  const primary = extractPage(fetched.html, fetched.finalUrl);

  const techStack = detectTechStack({
    html: fetched.html,
    headers: fetched.headers,
    scriptSrcs: primary.scriptSrcs,
    externalLinks: primary.externalLinksFull,
  });

  const finalHost = new URL(fetched.finalUrl).hostname.replace(/^www\./, "");
  const contacts = extractContacts({ page: primary, baseHost: finalHost });

  const hasCustomSignals =
    options.customSignals && options.customSignals.length > 0;

  const signals = hasCustomSignals
    ? detectCustomSignals({
        primary,
        html: fetched.html,
        customSignals: options.customSignals ?? [],
      })
    : detectSignals({
        primary,
        html: fetched.html,
        headers: fetched.headers,
        techStack,
        contacts,
        selectedSignals: options.selectedSignals,
      });

  let company;
  try {
    company = await analyzeWithLlm({
      url: fetched.finalUrl,
      title: primary.title,
      description: primary.description ?? primary.ogDescription,
      mainText: primary.mainText,
    });
  } catch (error) {
    if (error instanceof LlmError) {
      throw new DiscoveryError(error.message, "llm-failed");
    }
    throw new DiscoveryError("LLM analysis failed.", "llm-failed");
  }

  const legal = await extractLegalFromSite({
    baseUrl: fetched.finalUrl,
    internalLinks: primary.internalLinks,
    actionableLinks: primary.actionableLinks,
  });

  const enrichment = await runEnrichments({
    domain: finalHost,
    enabledApis: options.enabledApis,
  });

  const finalContacts = mergeContactsWithEnrichment(contacts, enrichment);
  const finalLegal = mergeLegalWithEnrichment(legal, enrichment);

  const people: Person[] = (company.people ?? []).map((p) => ({
    fullName: p.fullName,
    role: p.role,
    source: "homepage",
  }));
  if (finalLegal.publicationDirector) {
    const alreadyListed = people.some(
      (p) =>
        p.fullName.toLowerCase() ===
        finalLegal.publicationDirector!.toLowerCase()
    );
    if (!alreadyListed) {
      people.push({
        fullName: finalLegal.publicationDirector,
        role: "Directeur de la publication",
        source: "mentions-legales",
      });
    }
  }
  if (enrichment?.hunter?.emails) {
    for (const contact of enrichment.hunter.emails) {
      if (!contact.firstName && !contact.lastName) continue;
      const fullName = [contact.firstName, contact.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!fullName) continue;
      const alreadyListed = people.some(
        (p) => p.fullName.toLowerCase() === fullName.toLowerCase()
      );
      if (!alreadyListed) {
        people.push({
          fullName,
          role: contact.position,
          source: "hunter",
        });
      }
    }
  }

  const icp = scoreIcp({ company, signals, techStack });

  return {
    url,
    finalUrl: fetched.finalUrl,
    fetchedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    company,
    techStack,
    signals,
    contacts: finalContacts,
    legal: finalLegal,
    people,
    icp,
    enrichment,
    meta: {
      title: primary.title,
      description: primary.description ?? primary.ogDescription,
      favicon: enrichment?.logoUrl ?? primary.favicon,
      ogImage: primary.ogImage,
      language: primary.language,
    },
  };
}

function mergeContactsWithEnrichment(
  contacts: Contacts,
  enrichment: EnrichmentData | undefined
): Contacts {
  if (!enrichment) return contacts;
  const merged: Contacts = {
    emails: [...contacts.emails],
    phones: contacts.phones,
    socials: [...contacts.socials],
    hasContactForm: contacts.hasContactForm,
  };
  if (enrichment.hunter?.emails && enrichment.hunter.emails.length > 0) {
    const apiEmails = enrichment.hunter.emails
      .map((c) => c.email)
      .filter(Boolean);
    const dedup = new Set<string>();
    const reordered: string[] = [];
    for (const email of apiEmails) {
      const key = email.toLowerCase();
      if (!dedup.has(key)) {
        dedup.add(key);
        reordered.push(email);
      }
    }
    for (const email of contacts.emails) {
      const key = email.toLowerCase();
      if (!dedup.has(key)) {
        dedup.add(key);
        reordered.push(email);
      }
    }
    merged.emails = reordered;
  }
  if (enrichment.companyEnrich?.linkedinUrl) {
    if (!merged.socials.some((s) => s.platform === "linkedin")) {
      merged.socials = [
        ...merged.socials,
        {
          platform: "linkedin",
          url: enrichment.companyEnrich.linkedinUrl,
        },
      ];
    }
  }
  if (enrichment.companyEnrich?.twitterUrl) {
    if (!merged.socials.some((s) => s.platform === "twitter")) {
      merged.socials = [
        ...merged.socials,
        {
          platform: "twitter",
          url: enrichment.companyEnrich.twitterUrl,
        },
      ];
    }
  }
  return merged;
}

function mergeLegalWithEnrichment(
  legal: LegalInfo,
  enrichment: EnrichmentData | undefined
): LegalInfo {
  if (!enrichment?.companyEnrich) return legal;
  const enrich = enrichment.companyEnrich;
  return {
    legalName: enrich.legalName ?? legal.legalName,
    legalForm: legal.legalForm,
    registrationNumber: legal.registrationNumber,
    vatNumber: legal.vatNumber,
    shareCapital: legal.shareCapital,
    rcs: legal.rcs,
    headquartersAddress: enrich.location ?? legal.headquartersAddress,
    publicationDirector: legal.publicationDirector,
    hostingProvider: legal.hostingProvider,
    legalPageUrl: legal.legalPageUrl,
  };
}

async function extractLegalFromSite(input: {
  baseUrl: string;
  internalLinks: string[];
  actionableLinks: { text: string; href: string }[];
}): Promise<LegalInfo> {
  const candidates: string[] = [];
  for (const path of findLegalPagePaths(input.internalLinks)) {
    try {
      candidates.push(new URL(path, input.baseUrl).toString());
    } catch {
      // ignore invalid resolution
    }
  }
  for (const href of findLegalLinksFromActionable(input.actionableLinks)) {
    candidates.push(href);
  }

  const uniqueCandidates = Array.from(new Set(candidates)).slice(0, 3);
  if (uniqueCandidates.length === 0) return {};

  let merged: LegalInfo = {};
  for (const fullUrl of uniqueCandidates) {
    try {
      const legalFetched = await fetchPage(fullUrl);
      const extracted = extractLegalInfo({
        html: legalFetched.html,
        pageUrl: fullUrl,
      });
      merged = mergeLegal(merged, extracted);
    } catch {
      // ignore failed legal page fetch
    }
  }
  return merged;
}

function mergeLegal(base: LegalInfo, next: LegalInfo): LegalInfo {
  return {
    legalName: base.legalName ?? next.legalName,
    legalForm: base.legalForm ?? next.legalForm,
    registrationNumber: base.registrationNumber ?? next.registrationNumber,
    vatNumber: base.vatNumber ?? next.vatNumber,
    shareCapital: base.shareCapital ?? next.shareCapital,
    rcs: base.rcs ?? next.rcs,
    headquartersAddress: base.headquartersAddress ?? next.headquartersAddress,
    publicationDirector: base.publicationDirector ?? next.publicationDirector,
    hostingProvider: base.hostingProvider ?? next.hostingProvider,
    legalPageUrl: base.legalPageUrl ?? next.legalPageUrl,
  };
}
