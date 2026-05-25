import { TECH_PATTERNS } from "@/lib/constants";
import type { TechCategory, TechStack } from "@/lib/types";

type Detection = {
  category: TechCategory;
  name: string;
  evidence?: string;
};

export function detectTechStack(input: {
  html: string;
  headers: Record<string, string>;
  scriptSrcs: string[];
  externalLinks?: string[];
}): TechStack {
  const haystack = [
    input.html,
    ...input.scriptSrcs,
    ...(input.externalLinks ?? []),
  ].join("\n");
  const detections: Detection[] = [];

  for (const tech of TECH_PATTERNS) {
    let evidence: string | undefined;

    if (tech.patterns.length > 0) {
      for (const pattern of tech.patterns) {
        const match = haystack.match(pattern);
        if (match) {
          evidence = match[0].slice(0, 120);
          break;
        }
      }
    }

    if (!evidence && tech.headers) {
      for (const [headerName, regex] of Object.entries(tech.headers)) {
        const headerValue = input.headers[headerName.toLowerCase()];
        if (headerValue && regex.test(headerValue)) {
          evidence = `${headerName}: ${headerValue}`.slice(0, 120);
          break;
        }
      }
    }

    if (evidence) {
      detections.push({
        category: tech.category,
        name: tech.name,
        evidence,
      });
    }
  }

  const byCategory = new Map<TechCategory, Detection[]>();
  for (const detection of detections) {
    const list = byCategory.get(detection.category) ?? [];
    list.push(detection);
    byCategory.set(detection.category, list);
  }

  const order: TechCategory[] = [
    "framework",
    "hosting",
    "cms",
    "analytics",
    "marketing",
    "support",
    "payment",
    "other",
  ];

  return order
    .filter((cat) => byCategory.has(cat))
    .map((cat) => ({
      category: cat,
      items: (byCategory.get(cat) ?? []).map((d) => ({
        name: d.name,
        evidence: d.evidence,
      })),
    }));
}
