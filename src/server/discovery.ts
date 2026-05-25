import type { AnalysisResult, CustomSignal, SignalId } from "@/lib/types";
import { FetchError, fetchPage, normalizeUrl } from "@/server/scraping/fetcher";
import { extractPage } from "@/server/scraping/extractor";
import { extractContacts } from "@/server/scraping/contacts";
import { detectTechStack } from "@/server/scraping/tech-stack";
import { detectSignals } from "@/server/scraping/signals";
import { detectCustomSignals } from "@/server/scraping/custom-signals";
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
