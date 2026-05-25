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

type SignalExtract = {
  value?: string;
  evidence?: string;
};

const PLG_PATTERNS =
  /\b(free trial|start (for )?free|get started free|try (it )?free|try for free|essai gratuit|commencer gratuitement|s’inscrire gratuitement|sign up for free|start free trial)\b/i;

const ENTERPRISE_PATTERNS =
  /\b(book a demo|request (a )?demo|get a demo|schedule (a )?demo|contact sales|talk to sales|talk to an expert|reserver (une )?demo|demander une demo|reserver un workshop|contacter les ventes|parler (a|à) un expert)\b/i;

const CRM_TOOLS = ["HubSpot", "Salesforce", "Pipedrive", "Attio"];
const TRACKING_TOOLS = ["Koala", "Albacross", "Clearbit", "Segment", "Mixpanel", "PostHog", "Amplitude"];
const PAYMENT_TOOLS = ["Stripe", "PayPal", "Paddle", "Lemon Squeezy"];
const SUPPORT_TOOLS = ["Intercom", "Crisp", "Drift", "Zendesk", "Help Scout", "Tidio"];

export function detectSignals(input: SignalInput): Signal[] {
  const extracts = computeExtracts(input);
  const selectedSet = input.selectedSignals
    ? new Set(input.selectedSignals)
    : null;

  return SIGNAL_DEFINITIONS.map((def) => {
    const extract = extracts[def.id];
    return {
      id: def.id,
      label: def.label,
      category: def.category,
      weight: def.weight,
      detected: Boolean(extract?.value),
      selected: selectedSet === null || selectedSet.has(def.id),
      value: extract?.value,
      evidence: extract?.evidence,
    };
  });
}

function computeExtracts(
  input: SignalInput
): Partial<Record<SignalId, SignalExtract>> {
  const result: Partial<Record<SignalId, SignalExtract>> = {};
  const { primary, contacts, techStack } = input;
  const techNames = techStack.flatMap((c) => c.items.map((i) => i.name));

  if (contacts.emails.length > 0) {
    result["contact-email"] = {
      value: contacts.emails[0],
      evidence:
        contacts.emails.length > 1
          ? `+${contacts.emails.length - 1} autre${contacts.emails.length > 2 ? "s" : ""}`
          : undefined,
    };
  }

  if (contacts.phones.length > 0) {
    result["contact-phone"] = {
      value: contacts.phones[0],
    };
  }

  if (contacts.hasContactForm) {
    const contactLink = primary.internalLinks.find((p) =>
      /\/(contact|nous-contacter|contact-us)(\/|$)/i.test(p)
    );
    result["contact-form"] = {
      value: "Présent",
      evidence: contactLink ? `Page ${contactLink}` : undefined,
    };
  }

  const crms = CRM_TOOLS.filter((tool) => techNames.includes(tool));
  if (crms.length > 0) {
    result["crm-used"] = {
      value: crms.join(", "),
      evidence: "Détecté via scripts ou liens externes",
    };
  }

  const trackings = TRACKING_TOOLS.filter((tool) => techNames.includes(tool));
  if (trackings.length > 0) {
    result["tracking-stack"] = {
      value: trackings.join(", "),
    };
  }

  const payments = PAYMENT_TOOLS.filter((tool) => techNames.includes(tool));
  if (payments.length > 0) {
    result["payment-solution"] = {
      value: payments.join(", "),
    };
  }

  const supports = SUPPORT_TOOLS.filter((tool) => techNames.includes(tool));
  if (supports.length > 0) {
    result["support-chat"] = {
      value: supports.join(", "),
    };
  }

  const plgCta = primary.actionableLinks.find((l) => PLG_PATTERNS.test(l.text));
  if (plgCta) {
    result["model-plg"] = {
      value: plgCta.text,
      evidence: "CTA détecté sur la page",
    };
  } else if (PLG_PATTERNS.test(primary.mainText)) {
    result["model-plg"] = {
      value: "Essai gratuit mentionné",
    };
  }

  const enterpriseCta = primary.actionableLinks.find((l) =>
    ENTERPRISE_PATTERNS.test(l.text)
  );
  if (enterpriseCta) {
    result["model-enterprise"] = {
      value: enterpriseCta.text,
      evidence: "CTA détecté sur la page",
    };
  }

  const pricing = primary.internalLinks.find((p) =>
    /\/(pricing|tarifs?|plans|prix)(\/|$)/i.test(p)
  );
  if (pricing) {
    result["public-pricing"] = {
      value: pricing,
    };
  }

  const customers = primary.internalLinks.find((p) =>
    /\/(customers|clients|cas[-_]?clients?|case[-_]?studies|success-stories)(\/|$)/i.test(
      p
    )
  );
  if (customers) {
    result["case-studies"] = {
      value: customers,
    };
  }

  const complianceMatches = primary.mainText.match(
    /\b(soc\s?2|iso\s?27001|hipaa|gdpr|rgpd|pci\s?dss|pci-dss|ccpa)\b/gi
  );
  if (complianceMatches && complianceMatches.length > 0) {
    const unique = Array.from(
      new Set(complianceMatches.map((m) => m.toUpperCase()))
    );
    result["compliance-badges"] = {
      value: unique.join(", "),
    };
  }

  const careers = primary.internalLinks.find((p) =>
    /\/(careers?|jobs?|hiring|recrutement|on-recrute|join-us|work-with-us)(\/|$)/i.test(
      p
    )
  );
  if (careers) {
    result["active-careers"] = {
      value: careers,
    };
  }

  const hreflangCount = (input.html.match(/hreflang=/gi) ?? []).length;
  if (hreflangCount >= 2) {
    result["international-presence"] = {
      value: `${hreflangCount} langues / régions`,
    };
  }

  return result;
}
