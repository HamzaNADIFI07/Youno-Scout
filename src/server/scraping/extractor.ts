import * as cheerio from "cheerio";

export type LinkWithText = {
  href: string;
  text: string;
};

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
  externalLinksFull: string[];
  scriptSrcs: string[];
  mailtoLinks: string[];
  telLinks: string[];
  actionableLinks: LinkWithText[];
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

  const $forContent = cheerio.load(html);
  $forContent("script, style, noscript, svg, path").remove();

  const internalLinks = new Set<string>();
  const externalLinks = new Set<string>();
  const externalLinksFull = new Set<string>();
  const mailtoLinks = new Set<string>();
  const telLinks = new Set<string>();
  const actionableLinks: LinkWithText[] = [];

  $("a[href]").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    if (!href) return;
    const trimmed = href.trim();
    const linkText = $el.text().trim().replace(/\s+/g, " ");

    if (trimmed.startsWith("mailto:")) {
      const value = trimmed.slice("mailto:".length).split("?")[0].trim();
      if (value) mailtoLinks.add(value);
      return;
    }
    if (trimmed.startsWith("tel:")) {
      const value = trimmed.slice("tel:".length).split("?")[0].trim();
      if (value) telLinks.add(value);
      return;
    }

    const resolved = safeResolve(trimmed, base);
    if (!resolved) return;

    try {
      const linkUrl = new URL(resolved);
      if (linkUrl.hostname.endsWith(base.hostname)) {
        internalLinks.add(linkUrl.pathname.toLowerCase());
      } else {
        externalLinks.add(linkUrl.origin);
        externalLinksFull.add(linkUrl.href);
      }
      if (linkText && linkText.length > 0 && linkText.length < 80) {
        actionableLinks.push({ href: resolved, text: linkText });
      }
    } catch {
      // ignore malformed urls
    }
  });

  $("button").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text && text.length > 0 && text.length < 80) {
      actionableLinks.push({ href: "", text });
    }
  });

  const scriptSrcs: string[] = [];
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src) scriptSrcs.push(src);
  });

  const mainText = collapseWhitespace($forContent("body").text()).slice(
    0,
    MAX_TEXT_CHARS
  );

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
    externalLinksFull: Array.from(externalLinksFull),
    scriptSrcs,
    mailtoLinks: Array.from(mailtoLinks),
    telLinks: Array.from(telLinks),
    actionableLinks,
    rawHeadHtml: $("head").html() || "",
    rawBodyHtml: $("body").html()?.slice(0, 200_000) || "",
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
