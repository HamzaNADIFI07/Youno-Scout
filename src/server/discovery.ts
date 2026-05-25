import type {
  AnalysisResult,
  CustomSignal,
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
  findLegalPagePath,
} from "@/server/scraping/legal-extractor";
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
  });

  const people: Person[] = (company.people ?? []).map((p) => ({
    fullName: p.fullName,
    role: p.role,
    source: "homepage",
  }));
  if (legal.publicationDirector) {
    const alreadyListed = people.some(
      (p) => p.fullName.toLowerCase() === legal.publicationDirector!.toLowerCase()
    );
    if (!alreadyListed) {
      people.push({
        fullName: legal.publicationDirector,
        role: "Directeur de la publication",
        source: "mentions-legales",
      });
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
    contacts,
    legal,
    people,
    icp,
    meta: {
      title: primary.title,
      description: primary.description ?? primary.ogDescription,
      favicon: primary.favicon,
      ogImage: primary.ogImage,
      language: primary.language,
    },
  };
}

async function extractLegalFromSite(input: {
  baseUrl: string;
  internalLinks: string[];
}): Promise<LegalInfo> {
  const path = findLegalPagePath(input.internalLinks);
  if (!path) return {};

  try {
    const fullUrl = new URL(path, input.baseUrl).toString();
    const legalFetched = await fetchPage(fullUrl);
    return extractLegalInfo({ html: legalFetched.html, pageUrl: fullUrl });
  } catch {
    return {};
  }
}
