import { SIGNAL_DEFINITIONS } from "@/lib/constants";
import type { Signal, SignalId, TechStack } from "@/lib/types";
import type { ExtractedPage } from "./extractor";

type SignalInput = {
  primary: ExtractedPage;
  html: string;
  headers: Record<string, string>;
  techStack: TechStack;
  selectedSignals?: SignalId[];
};

export function detectSignals(input: SignalInput): Signal[] {
  const evidences = computeEvidences(input);
  const selectedSet = input.selectedSignals
    ? new Set(input.selectedSignals)
    : null;

  return SIGNAL_DEFINITIONS.map((def) => ({
    id: def.id,
    label: def.label,
    category: def.category,
    weight: def.weight,
    detected: Boolean(evidences[def.id]),
    selected: selectedSet === null || selectedSet.has(def.id),
    evidence: evidences[def.id],
  }));
}

function computeEvidences(input: SignalInput): Partial<Record<SignalId, string>> {
  const result: Partial<Record<SignalId, string>> = {};
  const { primary, html, techStack } = input;

  const links = primary.internalLinks;
  const lowerText = primary.mainText.toLowerCase();

  const pricing = links.find((p) =>
    /\/(pricing|tarifs?|plans|prix)(\/|$)/i.test(p)
  );
  if (pricing) {
    result["public-pricing"] = `Lien interne détecté : ${pricing}`;
  }

  if (/\benterprise\b|for teams|for companies|grands comptes/i.test(lowerText)) {
    result["enterprise-tier"] = "Mention 'Enterprise' ou 'for teams' dans la copy.";
  }

  const apiLink = links.find((p) =>
    /\/(api|developers?|docs?|integrations?)(\/|$)/i.test(p)
  );
  if (apiLink) {
    result["api-or-integrations"] = `Lien interne détecté : ${apiLink}`;
  }

  const customersLink = links.find((p) =>
    /\/(customers|clients|cas[-_]?clients?|case[-_]?studies)(\/|$)/i.test(p)
  );
  if (customersLink) {
    result["case-studies"] = `Lien interne détecté : ${customersLink}`;
  }

  if (
    /trusted by|used by|loved by|powering|rejoignent|nous font confiance/i.test(
      primary.mainText
    )
  ) {
    result["customer-logos"] = "Pattern social proof détecté dans le texte.";
  }

  const careersLink = links.find((p) =>
    /\/(careers?|jobs?|hiring|recrutement|on-recrute)(\/|$)/i.test(p)
  );
  if (careersLink) {
    result["active-careers"] = `Lien interne détecté : ${careersLink}`;
  }

  const compliance = lowerText.match(
    /\b(soc\s?2|iso\s?27001|hipaa|gdpr|rgpd|pci\s?dss|pci-dss)\b/i
  );
  if (compliance) {
    result["compliance-badges"] = `Mention détectée : ${compliance[0]}`;
  }

  const hreflangCount = (html.match(/hreflang=/gi) ?? []).length;
  if (hreflangCount >= 2) {
    result["multilingual"] = `${hreflangCount} balises hreflang détectées.`;
  }

  const blogLink = links.find((p) => /\/(blog|articles?|news|insights?)(\/|$)/i.test(p));
  if (blogLink) {
    result["blog-active"] = `Lien interne détecté : ${blogLink}`;
  }

  const hasEmailInput = /<input[^>]+type=["']?email["']?/i.test(html);
  const newsletterContext =
    /newsletter|subscribe|abonnez|inscrivez|stay updated|recevez/i.test(
      primary.mainText
    );
  if (hasEmailInput && newsletterContext) {
    result["newsletter-signup"] = "Formulaire email avec contexte newsletter.";
  }

  const supportTechs = techStack.find((c) => c.category === "support");
  if (supportTechs && supportTechs.items.length > 0) {
    result["live-chat"] = `Widget détecté : ${supportTechs.items
      .map((i) => i.name)
      .join(", ")}`;
  }

  if (primary.ogTitle || primary.ogDescription || primary.ogImage) {
    const parts = [
      primary.ogTitle && "og:title",
      primary.ogDescription && "og:description",
      primary.ogImage && "og:image",
    ].filter(Boolean);
    result["open-graph-set"] = `${parts.join(", ")} configurés.`;
  }

  return result;
}
