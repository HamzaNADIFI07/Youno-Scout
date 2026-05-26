const LOGO_BASE = "https://logo.clearbit.com";

export async function fetchClearbitLogo(domain: string): Promise<string | null> {
  const clean = domain.toLowerCase().replace(/^www\./, "").trim();
  if (!clean) return null;
  const url = `${LOGO_BASE}/${clean}`;
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) return null;
    return url;
  } catch {
    return null;
  }
}
