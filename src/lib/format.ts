import type {
  BusinessModel,
  CompanySize,
  IcpVerdict,
  TechCategory,
} from "@/lib/types";

export function formatBusinessModel(model: BusinessModel): string {
  switch (model) {
    case "b2b":
      return "B2B";
    case "b2c":
      return "B2C";
    case "b2b2c":
      return "B2B2C";
    case "marketplace":
      return "Marketplace";
    default:
      return "Non identifié";
  }
}

export function formatCompanySize(size: CompanySize): string {
  switch (size) {
    case "startup":
      return "Startup (< 50)";
    case "smb":
      return "PME (50-200)";
    case "mid-market":
      return "Mid-market (200-1000)";
    case "enterprise":
      return "Enterprise (1000+)";
    default:
      return "Taille inconnue";
  }
}

export function formatVerdict(verdict: IcpVerdict): {
  label: string;
  tone: "positive" | "neutral" | "warning" | "negative";
} {
  switch (verdict) {
    case "strong-fit":
      return { label: "Fit fort", tone: "positive" };
    case "good-fit":
      return { label: "Fit correct", tone: "positive" };
    case "partial-fit":
      return { label: "Fit partiel", tone: "warning" };
    default:
      return { label: "Fit faible", tone: "negative" };
  }
}

export function formatTechCategory(category: TechCategory): string {
  switch (category) {
    case "framework":
      return "Framework";
    case "hosting":
      return "Hébergement";
    case "cms":
      return "CMS";
    case "analytics":
      return "Analytics";
    case "marketing":
      return "Marketing";
    case "support":
      return "Support";
    case "payment":
      return "Paiement";
    default:
      return "Autre";
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
