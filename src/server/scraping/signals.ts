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

const FUNDING_PATTERNS =
  /\b(series\s+[a-d]\b|seed\s+round|pre-seed|raised?\s+\$?[0-9]|\$\s?\d+(?:\.\d+)?\s?(?:k|m|million|b|billion)\b|funded\s+by|backed\s+by|our\s+investors|venture\s+(?:capital|fund)|tour\s+de\s+table|lev[eé]e?\s+de\s+fonds)/i;

const CRM_TOOLS = ["HubSpot", "Salesforce", "Pipedrive", "Attio"];
const TRACKING_TOOLS = [
  "Segment",
  "Mixpanel",
  "PostHog",
  "Amplitude",
  "Koala",
  "Albacross",
  "Clearbit",
];
const MARKETING_AUTOMATION_TOOLS = [
  "HubSpot",
  "Marketo",
  "Pardot",
  "Customer.io",
  "Klaviyo",
];

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
  const { primary, techStack } = input;
  const techNames = techStack.flatMap((c) => c.items.map((i) => i.name));

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

  const marketingTools = MARKETING_AUTOMATION_TOOLS.filter((tool) =>
    techNames.includes(tool)
  );
  if (marketingTools.length > 0) {
    result["marketing-automation"] = {
      value: marketingTools.join(", "),
    };
  }

  const plgCta = primary.actionableLinks.find((l) => PLG_PATTERNS.test(l.text));
  const plgInText = PLG_PATTERNS.test(primary.mainText);
  const enterpriseCta = primary.actionableLinks.find((l) =>
    ENTERPRISE_PATTERNS.test(l.text)
  );

  const hasPlg = Boolean(plgCta) || plgInText;
  const hasEnterprise = Boolean(enterpriseCta);

  if (hasPlg && hasEnterprise) {
    result["sales-model"] = {
      value: "Hybride (PLG + Sales-Led)",
      evidence: `${plgCta ? "« " + plgCta.text + " »" : "Essai gratuit mentionné"} + « ${enterpriseCta!.text} »`,
    };
  } else if (hasPlg) {
    result["sales-model"] = {
      value: "Product-Led",
      evidence: plgCta ? `« ${plgCta.text} »` : "Essai gratuit mentionné",
    };
  } else if (hasEnterprise) {
    result["sales-model"] = {
      value: "Sales-Led",
      evidence: `« ${enterpriseCta!.text} »`,
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

  const funding = primary.mainText.match(FUNDING_PATTERNS);
  if (funding) {
    result["funding-mention"] = {
      value: funding[0].trim(),
    };
  }

  const hreflangCount = (input.html.match(/hreflang=/gi) ?? []).length;
  if (hreflangCount >= 2) {
    result["international-presence"] = {
      value: `${hreflangCount} langues / régions`,
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

  return result;
}
