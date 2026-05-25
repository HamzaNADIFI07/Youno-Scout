import type {
  CustomSignal,
  CustomSignalCategory,
  Signal,
} from "@/lib/types";
import type { ExtractedPage } from "./extractor";

const CATEGORY_MAP: Record<CustomSignalCategory, Signal["category"]> = {
  joignabilite: "go-to-market",
  maturite: "maturity",
  croissance: "growth",
  produit: "product",
  fit: "go-to-market",
};

export function detectCustomSignals(input: {
  primary: ExtractedPage;
  html: string;
  customSignals: CustomSignal[];
}): Signal[] {
  const { primary, html, customSignals } = input;
  const lowerText = primary.mainText.toLowerCase();
  const lowerHtml = html.toLowerCase();
  const internalLinks = primary.internalLinks.map((p) => p.toLowerCase());

  return customSignals.map((cs) => {
    let evidence: string | undefined;

    for (const keyword of cs.detection.keywords) {
      const needle = keyword.trim().toLowerCase();
      if (needle.length === 0) continue;
      if (lowerText.includes(needle) || lowerHtml.includes(needle)) {
        evidence = `Mot-clé détecté : « ${keyword} »`;
        break;
      }
    }

    if (!evidence) {
      for (const pattern of cs.detection.urlPatterns) {
        const needle = pattern.trim().toLowerCase();
        if (needle.length === 0) continue;
        const match = internalLinks.find((link) => link.includes(needle));
        if (match) {
          evidence = `Lien interne détecté : ${match}`;
          break;
        }
      }
    }

    return {
      id: cs.id,
      label: cs.label,
      category: CATEGORY_MAP[cs.category],
      detected: Boolean(evidence),
      weight: cs.weight,
      selected: true,
      evidence,
    };
  });
}
