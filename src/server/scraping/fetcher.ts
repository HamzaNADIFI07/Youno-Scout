import { FETCH_TIMEOUT_MS, MAX_HTML_BYTES, USER_AGENT } from "@/lib/constants";

export type FetchedPage = {
  url: string;
  finalUrl: string;
  status: number;
  html: string;
  headers: Record<string, string>;
};

export class FetchError extends Error {
  code: "timeout" | "blocked" | "fetch-failed";
  constructor(message: string, code: FetchError["code"]) {
    super(message);
    this.code = code;
    this.name = "FetchError";
  }
}

export async function fetchPage(url: string): Promise<FetchedPage> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.8,fr;q=0.6",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (response.status === 403 || response.status === 401) {
      throw new FetchError(
        `Site blocked the request (status ${response.status}).`,
        "blocked"
      );
    }

    if (!response.ok) {
      throw new FetchError(
        `Site responded with status ${response.status}.`,
        "fetch-failed"
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new FetchError("Empty response body.", "fetch-failed");
    }

    const decoder = new TextDecoder("utf-8");
    let received = 0;
    let html = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_HTML_BYTES) {
        await reader.cancel();
        break;
      }
      html += decoder.decode(value, { stream: true });
    }
    html += decoder.decode();

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    return {
      url,
      finalUrl: response.url || url,
      status: response.status,
      html,
      headers,
    };
  } catch (error) {
    if (error instanceof FetchError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FetchError(
        `Request timed out after ${FETCH_TIMEOUT_MS}ms.`,
        "timeout"
      );
    }
    throw new FetchError(
      error instanceof Error ? error.message : "Unknown fetch error.",
      "fetch-failed"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function normalizeUrl(input: string): string {
  let candidate = input.trim();
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  const url = new URL(candidate);
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error("Only http and https protocols are supported.");
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Local or private URLs are not allowed.");
  }
  url.hash = "";
  return url.toString();
}
