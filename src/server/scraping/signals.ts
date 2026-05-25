import { SIGNAL_DEFINITIONS } from "@/lib/constants";
import type { Contacts, Signal, SignalId, TechStack } from "@/lib/types";
import type { ExtractedPage } from "./extractor";

type SignalInput = {
  primary: ExtractedPage;
  html: string;
  headers: Record<string, string>;
  techStack: TechStack;
  contacts: Contacts;
  selectedSignals?: SignalId[];
};

const FUNDING_PATTERNS =
  /\b(series\s+[a-d]\b|seed\s+round|pre-seed|raised?\s+\$?\d|\$\s?\d+(?:\.\d+)?\s?(?:k|m|million|b|billion)\b|funded\s+by|backed\s+by|our\s+investors|venture\s+(?:capital|fund))/i;

const MODERN_FRAMEWORK_NAMES = new Set([
  "Next.js",
  "Nuxt",
  "Astro",
  "Svelte",
  "Remix",
  "React",
  "Vue",
]);

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
  const { primary, html, contacts, techStack } = input;

  if (contacts.emails.length > 0) {
    result["contact-email"] = `${contacts.emails[0]}${
      contacts.emails.length > 1 ? ` (+${contacts.emails.length - 1})` : ""
    }`;
  }

  if (contacts.phones.length > 0) {
    result["contact-phone"] = contacts.phones[0];
  }

  if (contacts.hasContactForm) {
    const contactLink = primary.internalLinks.find((p) =>
      /\/(contact|nous-contacter|contact-us)(\/|$)/i.test(p)
    );
    result["contact-form"] = contactLink
      ? `Page ${contactLink}`
      : "Mention « contact » trouvée";
  }

  if (
    /\benterprise\b|for teams|for companies|grands comptes|grandes entreprises/i.test(
      primary.mainText
    )
  ) {
    result["enterprise-tier"] = "Mention « Enterprise » ou « for teams »";
  }

  const customers = primary.internalLinks.find((p) =>
    /\/(customers|clients|cas[-_]?clients?|case[-_]?studies|success-stories)(\/|$)/i.test(
      p
    )
  );
  if (customers) {
    result["case-studies"] = `Lien ${customers}`;
  }

  const compliance = primary.mainText.match(
    /\b(soc\s?2|iso\s?27001|hipaa|gdpr|rgpd|pci\s?dss|pci-dss|ccpa)\b/i
  );
  if (compliance) {
    result["compliance-badges"] = `Mention : ${compliance[0]}`;
  }

  const careers = primary.internalLinks.find((p) =>
    /\/(careers?|jobs?|hiring|recrutement|on-recrute|join-us|work-with-us)(\/|$)/i.test(
      p
    )
  );
  if (careers) {
    result["active-careers"] = `Lien ${careers}`;
  }

  const funding = primary.mainText.match(FUNDING_PATTERNS);
  if (funding) {
    result["funding-mention"] = `Mention : « ${funding[0].trim()} »`;
  }

  const hreflangCount = (html.match(/hreflang=/gi) ?? []).length;
  if (hreflangCount >= 2) {
    result["international-presence"] = `${hreflangCount} balises hreflang détectées`;
  }

  const pricing = primary.internalLinks.find((p) =>
    /\/(pricing|tarifs?|plans|prix)(\/|$)/i.test(p)
  );
  if (pricing) {
    result["public-pricing"] = `Lien ${pricing}`;
  }

  const docs = primary.internalLinks.find((p) =>
    /\/(docs?|developers?|api|reference)(\/|$)/i.test(p)
  );
  if (docs) {
    result["developer-docs"] = `Lien ${docs}`;
  }

  const modernFrameworks = techStack
    .flatMap((c) => c.items.map((i) => i.name))
    .filter((name) => MODERN_FRAMEWORK_NAMES.has(name));
  if (modernFrameworks.length > 0) {
    result["modern-stack"] = `Framework : ${modernFrameworks.join(", ")}`;
  }

  return result;
}
