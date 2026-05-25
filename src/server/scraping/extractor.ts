import * as cheerio from "cheerio";

export type ExtractedPage = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  favicon?: string;
  language?: string;
  canonicalUrl?: string;
  mainText: string;
  internalLinks: string[];
  externalLinks: string[];
  scriptSrcs: string[];
  rawHeadHtml: string;
  rawBodyHtml: string;
};

const MAX_TEXT_CHARS = 20_000;

export function extractPage(html: string, pageUrl: string): ExtractedPage {
  const $ = cheerio.load(html);
  const base = new URL(pageUrl);

  const title = $("title").first().text().trim() || undefined;
  const description = $('meta[name="description"]').attr("content")?.trim();
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDescription = $('meta[property="og:description"]')
    .attr("content")
    ?.trim();
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  const language = $("html").attr("lang")?.trim();
  const canonicalUrl = $('link[rel="canonical"]').attr("href")?.trim();

  const faviconHref =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    $('link[rel="apple-touch-icon"]').attr("href");

  const favicon = faviconHref
    ? safeResolve(faviconHref, base)
    : safeResolve("/favicon.ico", base);

  $("script, style, noscript, svg, path").remove();

  const internalLinks = new Set<string>();
  const externalLinks = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const resolved = safeResolve(href, base);
    if (!resolved) return;
    try {
      const linkUrl = new URL(resolved);
      if (linkUrl.hostname.endsWith(base.hostname)) {
        internalLinks.add(linkUrl.pathname.toLowerCase());
      } else {
        externalLinks.add(linkUrl.origin);
      }
    } catch {
      // ignore malformed urls
    }
  });

  const $temp = cheerio.load(html);
  const scriptSrcs: string[] = [];
  $temp("script[src]").each((_, el) => {
    const src = $temp(el).attr("src");
    if (src) scriptSrcs.push(src);
  });

  const mainText = collapseWhitespace($("body").text()).slice(0, MAX_TEXT_CHARS);

  return {
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage: ogImage ? safeResolve(ogImage, base) : undefined,
    favicon,
    language,
    canonicalUrl,
    mainText,
    internalLinks: Array.from(internalLinks),
    externalLinks: Array.from(externalLinks),
    scriptSrcs,
    rawHeadHtml: $temp("head").html() || "",
    rawBodyHtml: $temp("body").html()?.slice(0, 200_000) || "",
  };
}

function safeResolve(href: string, base: URL): string | undefined {
  try {
    return new URL(href, base).toString();
  } catch {
    return undefined;
  }
}

function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}
