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

const PLG_PATTERNS =
  /\b(free trial|start (for )?free|get started free|try (it )?free|try for free|essai gratuit|commencer gratuitement|s’inscrire gratuitement|sign up for free)\b/i;

const ENTERPRISE_PATTERNS =
  /\b(book a demo|request (a )?demo|get a demo|schedule (a )?demo|contact sales|talk to sales|talk to an expert|reserver (une )?demo|demander une demo|contacter les ventes|parler (a|à) un expert)\b/i;

const TRACKING_IP_TOOLS = new Set(["Koala", "Albacross", "Clearbit"]);

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

  const techNames = techStack.flatMap((c) => c.items.map((i) => i.name));

  if (techNames.includes("HubSpot")) {
    result["crm-hubspot"] = "Scripts HubSpot détectés sur la page";
  }

  if (techNames.includes("Salesforce")) {
    result["crm-salesforce"] = "Scripts Salesforce détectés";
  }

  const ipTools = techNames.filter((n) => TRACKING_IP_TOOLS.has(n));
  if (ipTools.length > 0) {
    result["tracking-ip-based"] = `Outils détectés : ${ipTools.join(", ")}`;
  }

  if (techNames.includes("Stripe")) {
    result["payment-stripe"] = "Stripe.js détecté → modèle transactionnel";
  }

  const supportTools = techStack
    .find((c) => c.category === "support")
    ?.items.map((i) => i.name) ?? [];
  if (supportTools.length > 0) {
    result["support-chat"] = `Widget détecté : ${supportTools.join(", ")}`;
  }

  const plgCta = primary.actionableLinks.find((l) => PLG_PATTERNS.test(l.text));
  if (plgCta || PLG_PATTERNS.test(primary.mainText)) {
    result["model-plg"] = plgCta
      ? `CTA : « ${plgCta.text} »`
      : "Mention d’un essai gratuit dans la copy";
  }

  const enterpriseCta = primary.actionableLinks.find((l) =>
    ENTERPRISE_PATTERNS.test(l.text)
  );
  if (enterpriseCta) {
    result["model-enterprise"] = `CTA : « ${enterpriseCta.text} »`;
  }

  const pricing = primary.internalLinks.find((p) =>
    /\/(pricing|tarifs?|plans|prix)(\/|$)/i.test(p)
  );
  if (pricing) {
    result["public-pricing"] = `Lien ${pricing}`;
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

  const hreflangCount = (input.html.match(/hreflang=/gi) ?? []).length;
  if (hreflangCount >= 2) {
    result["international-presence"] = `${hreflangCount} balises hreflang détectées`;
  }

  return result;
}
