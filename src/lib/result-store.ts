import type { AnalysisResult } from "@/lib/types";

const STORAGE_KEY = "scout:last-result";

export function storeAnalysisResult(result: AnalysisResult): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // sessionStorage may be unavailable in private mode; analysis stays in memory only.
  }
}

export function readAnalysisResult(): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

export function clearAnalysisResult(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
