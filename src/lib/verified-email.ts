export type MeResponse =
  | { authenticated: false }
  | { authenticated: true; email: string };

export async function fetchSession(): Promise<MeResponse> {
  try {
    const response = await fetch("/api/me", {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) return { authenticated: false };
    return (await response.json()) as MeResponse;
  } catch {
    return { authenticated: false };
  }
}
