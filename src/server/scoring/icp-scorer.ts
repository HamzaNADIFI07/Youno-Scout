import {
  ICP_BUSINESS_MODEL_MAX,
  ICP_MATURITY_MAX,
  ICP_SIGNALS_MAX,
  ICP_TECH_MAX,
} from "@/lib/constants";
import type {
  IcpScore,
  IcpVerdict,
  LlmCompanyInsight,
  ScoreBreakdownEntry,
  Signal,
  TechStack,
} from "@/lib/types";

const MODERN_FRAMEWORKS = new Set([
  "Next.js",
  "Nuxt",
  "Astro",
  "Svelte",
  "Remix",
  "React",
  "Vue",
]);

const RICH_ANALYTICS = new Set([
  "Segment",
  "Mixpanel",
  "PostHog",
  "Amplitude",
  "HubSpot",
]);

export function scoreIcp(input: {
  company: LlmCompanyInsight;
  signals: Signal[];
  techStack: TechStack;
}): IcpScore {
  const businessModelEntry = scoreBusinessModel(input.company);
  const signalsEntry = scoreSignals(input.signals);
  const techEntry = scoreTech(input.techStack);
  const maturityEntry = scoreMaturity(input.signals);

  const breakdown: ScoreBreakdownEntry[] = [
    businessModelEntry,
    signalsEntry,
    techEntry,
    maturityEntry,
  ];

  const total = breakdown.reduce((sum, entry) => sum + entry.score, 0);
  const verdict = verdictFromScore(total);

  return {
    total,
    verdict,
    breakdown,
    rationale: buildRationale(input.company, total, verdict),
  };
}

function scoreBusinessModel(company: LlmCompanyInsight): ScoreBreakdownEntry {
  const max = ICP_BUSINESS_MODEL_MAX;
  let score = 0;
  let reasoning = "";

  switch (company.businessModel) {
    case "b2b":
      score = max;
      reasoning = "Modèle B2B confirmé.";
      break;
    case "b2b2c":
      score = Math.round(max * 0.6);
      reasoning = "Modèle hybride B2B2C.";
      break;
    case "marketplace":
      score = Math.round(max * 0.4);
      reasoning = "Marketplace, fit B2B partiel.";
      break;
    case "b2c":
      score = 0;
      reasoning = "Modèle B2C, pas dans la cible ICP.";
      break;
    default:
      score = Math.round(max * 0.2);
      reasoning = "Modèle non clairement identifié.";
  }

  return {
    category: "Modèle économique",
    score,
    maxScore: max,
    reasoning,
  };
}

function scoreSignals(signals: Signal[]): ScoreBreakdownEntry {
  const max = ICP_SIGNALS_MAX;
  const eligible = signals.filter((s) => s.selected);
  const totalWeight = eligible.reduce((sum, s) => sum + s.weight, 0);
  const detectedWeight = eligible
    .filter((s) => s.detected)
    .reduce((sum, s) => sum + s.weight, 0);

  const score =
    totalWeight === 0
      ? 0
      : Math.round((detectedWeight / totalWeight) * max);

  const detectedCount = eligible.filter((s) => s.detected).length;
  const reasoning =
    eligible.length === 0
      ? "Aucun signal GTM sélectionné."
      : `${detectedCount} signaux sur ${eligible.length} retenus détectés (poids ${detectedWeight}/${totalWeight}).`;

  return {
    category: "Signaux GTM",
    score,
    maxScore: max,
    reasoning,
  };
}

function scoreTech(techStack: TechStack): ScoreBreakdownEntry {
  const max = ICP_TECH_MAX;
  const allItems = techStack.flatMap((c) => c.items.map((i) => i.name));

  const hasModernFramework = allItems.some((name) =>
    MODERN_FRAMEWORKS.has(name)
  );
  const hasRichAnalytics = allItems.some((name) => RICH_ANALYTICS.has(name));
  const hasModernHosting = allItems.some((name) =>
    ["Vercel", "Netlify", "Cloudflare", "AWS CloudFront"].includes(name)
  );
  const hasPayment = techStack.some((c) => c.category === "payment");

  let score = 0;
  const reasons: string[] = [];

  if (hasModernFramework) {
    score += 6;
    reasons.push("framework moderne");
  }
  if (hasRichAnalytics) {
    score += 4;
    reasons.push("analytics produit");
  }
  if (hasModernHosting) {
    score += 3;
    reasons.push("hosting moderne");
  }
  if (hasPayment) {
    score += 2;
    reasons.push("solution de paiement");
  }

  score = Math.min(score, max);

  return {
    category: "Stack technique",
    score,
    maxScore: max,
    reasoning:
      reasons.length === 0
        ? "Aucun marqueur tech moderne détecté."
        : `Détecté : ${reasons.join(", ")}.`,
  };
}

function scoreMaturity(signals: Signal[]): ScoreBreakdownEntry {
  const max = ICP_MATURITY_MAX;
  const maturitySignals = signals.filter(
    (s) => s.category === "maturity" && s.selected
  );
  const detected = maturitySignals.filter((s) => s.detected);

  const totalWeight = maturitySignals.reduce((sum, s) => sum + s.weight, 0);
  const detectedWeight = detected.reduce((sum, s) => sum + s.weight, 0);

  const score =
    totalWeight === 0 ? 0 : Math.round((detectedWeight / totalWeight) * max);

  const reasoning =
    maturitySignals.length === 0
      ? "Aucun signal de maturité dans la sélection."
      : detected.length === 0
        ? "Aucun marqueur de maturité visible."
        : `Marqueurs détectés : ${detected.map((s) => s.label).join(", ")}.`;

  return {
    category: "Maturité",
    score,
    maxScore: max,
    reasoning,
  };
}

function verdictFromScore(total: number): IcpVerdict {
  if (total >= 80) return "strong-fit";
  if (total >= 60) return "good-fit";
  if (total >= 40) return "partial-fit";
  return "poor-fit";
}

function buildRationale(
  company: LlmCompanyInsight,
  total: number,
  verdict: IcpVerdict
): string {
  const verdictLabel: Record<IcpVerdict, string> = {
    "strong-fit": "fit fort",
    "good-fit": "fit correct",
    "partial-fit": "fit partiel",
    "poor-fit": "fit faible",
  };

  return `${company.name} obtient ${total}/100 sur l'ICP "SaaS B2B mid-market" (${verdictLabel[verdict]}). Modèle ${company.businessModel}, cible ${company.targetAudience}.`;
}
