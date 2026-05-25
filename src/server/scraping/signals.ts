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

const DEMO_PATTERNS =
  /\b(book a demo|request (a )?demo|get a demo|schedule (a )?demo|reserver (une )?demo|demander une demo)\b/i;
const FREE_TRIAL_PATTERNS =
  /\b(free trial|start (for )?free|get started free|try (it )?free|try for free|essai gratuit|commencer gratuitement)\b/i;
const CONTACT_SALES_PATTERNS =
  /\b(contact sales|talk to sales|talk to an expert|contacter les ventes|parler (a|à) un expert|nous contacter)\b/i;

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
  const { primary, contacts, techStack } = input;

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

  const linkedin = contacts.socials.find((s) => s.platform === "linkedin");
  if (linkedin) {
    result["linkedin-company"] = linkedin.url;
  }

  const github = contacts.socials.find((s) => s.platform === "github");
  if (github) {
    result["github-public"] = github.url;
  }

  const twitter = contacts.socials.find((s) => s.platform === "twitter");
  if (twitter) {
    result["twitter-x-presence"] = twitter.url;
  }

  const demoCta = primary.actionableLinks.find((l) =>
    DEMO_PATTERNS.test(l.text)
  );
  if (demoCta) {
    result["demo-cta"] = `« ${demoCta.text} »`;
  }

  const trialCta = primary.actionableLinks.find((l) =>
    FREE_TRIAL_PATTERNS.test(l.text)
  );
  if (trialCta) {
    result["free-trial-cta"] = `« ${trialCta.text} »`;
  }

  const contactSalesCta = primary.actionableLinks.find((l) =>
    CONTACT_SALES_PATTERNS.test(l.text)
  );
  if (contactSalesCta) {
    result["contact-sales-cta"] = `« ${contactSalesCta.text} »`;
  }

  const pricing = primary.internalLinks.find((p) =>
    /\/(pricing|tarifs?|plans|prix)(\/|$)/i.test(p)
  );
  if (pricing) {
    result["public-pricing"] = `Lien ${pricing}`;
  }

  if (/\benterprise\b|for teams|for companies|grands comptes/i.test(primary.mainText)) {
    result["enterprise-tier"] = "Mention « Enterprise » ou « for teams » dans la copy";
  }

  const docs = primary.internalLinks.find((p) =>
    /\/(docs?|developers?|api|reference)(\/|$)/i.test(p)
  );
  if (docs) {
    result["developer-docs"] = `Lien ${docs}`;
  } else if (techStack.some((c) => c.category === "framework")) {
    // fallback : présence d'un sous-domaine docs détectable via links
  }

  const compliance = primary.mainText.match(
    /\b(soc\s?2|iso\s?27001|hipaa|gdpr|rgpd|pci\s?dss|pci-dss)\b/i
  );
  if (compliance) {
    result["compliance-badges"] = `Mention : ${compliance[0]}`;
  }

  const customers = primary.internalLinks.find((p) =>
    /\/(customers|clients|cas[-_]?clients?|case[-_]?studies|success-stories)(\/|$)/i.test(p)
  );
  if (customers) {
    result["case-studies"] = `Lien ${customers}`;
  }

  const careers = primary.internalLinks.find((p) =>
    /\/(careers?|jobs?|hiring|recrutement|on-recrute|join-us)(\/|$)/i.test(p)
  );
  if (careers) {
    result["active-careers"] = `Lien ${careers}`;
  }

  return result;
}
