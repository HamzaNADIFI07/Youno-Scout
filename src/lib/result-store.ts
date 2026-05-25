import type { AnalysisResult } from "@/lib/types";

const STORAGE_KEY = "scout:last-result";

let cachedRaw: string | null = null;
let cachedResult: AnalysisResult | null = null;
let cacheInitialized = false;

function refreshCache(): void {
  if (typeof window === "undefined") {
    cachedRaw = null;
    cachedResult = null;
    cacheInitialized = true;
    return;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (cacheInitialized && raw === cachedRaw) return;
  cachedRaw = raw;
  cacheInitialized = true;
  if (!raw) {
    cachedResult = null;
    return;
  }
  try {
    cachedResult = JSON.parse(raw) as AnalysisResult;
  } catch {
    cachedResult = null;
  }
}

export function storeAnalysisResult(result: AnalysisResult): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(result);
    sessionStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedResult = result;
    cacheInitialized = true;
  } catch {
    // sessionStorage may be unavailable in private mode; analysis stays in memory only.
  }
}

export function readAnalysisResult(): AnalysisResult | null {
  refreshCache();
  return cachedResult;
}

export function clearAnalysisResult(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedResult = null;
    cacheInitialized = true;
  } catch {
    // noop
  }
}
