import { renderToBuffer } from "@react-pdf/renderer";
import type { AnalysisResult } from "@/lib/types";
import { ScoutReport } from "./scout-report";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Produit le PDF du rapport sous forme de Buffer Node.
 *
 * Le logo Youno est référencé via une URL publique servie par l'app
 * elle-même (public/youno-logo.png).
 */
export async function renderScoutReport(
  result: AnalysisResult
): Promise<Buffer> {
  const logoUrl = `${getAppUrl().replace(/\/$/, "")}/youno-logo.png`;
  return renderToBuffer(<ScoutReport result={result} logoUrl={logoUrl} />);
}

export function reportFileName(result: AnalysisResult): string {
  const slug = result.company.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const date = new Date().toISOString().slice(0, 10);
  return `rapport-scout-${slug || "company"}-${date}.pdf`;
}
