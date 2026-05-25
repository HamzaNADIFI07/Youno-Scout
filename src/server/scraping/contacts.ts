import type { Contacts, SocialLink, SocialPlatform } from "@/lib/types";
import type { ExtractedPage } from "./extractor";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX =
  /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{1,4}){2,5}/g;

const IGNORED_EMAIL_DOMAINS = [
  "example.com",
  "sentry.io",
  "googletagmanager.com",
  "google-analytics.com",
  "wixpress.com",
];

const SOCIAL_HOSTS: Record<string, SocialPlatform> = {
  "linkedin.com": "linkedin",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "github.com": "github",
  "facebook.com": "facebook",
  "fb.com": "facebook",
  "instagram.com": "instagram",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "tiktok.com": "tiktok",
};

const SOCIAL_BLOCKLIST = [
  "intent",
  "share",
  "watch",
  "embed",
  "/login",
  "/signin",
];

export function extractContacts(input: {
  page: ExtractedPage;
  baseHost: string;
}): Contacts {
  const { page, baseHost } = input;

  const emails = new Set<string>();
  for (const e of page.mailtoLinks) addEmailIfValid(e, baseHost, emails);
  const textEmails = page.mainText.match(EMAIL_REGEX) ?? [];
  for (const e of textEmails) addEmailIfValid(e, baseHost, emails);

  const phones = new Set<string>();
  for (const t of page.telLinks) {
    const cleaned = cleanPhone(t);
    if (cleaned) phones.add(cleaned);
  }
  const textPhones = page.mainText.match(PHONE_REGEX) ?? [];
  for (const t of textPhones) {
    const cleaned = cleanPhone(t);
    if (cleaned) phones.add(cleaned);
  }

  const socials = collectSocials(page.externalLinksFull);

  const hasContactForm =
    page.internalLinks.some((p) =>
      /\/(contact|nous-contacter|contact-us|get-in-touch)(\/|$)/i.test(p)
    ) || /contact us|nous contacter|get in touch/i.test(page.mainText);

  return {
    emails: Array.from(emails).slice(0, 8),
    phones: Array.from(phones).slice(0, 4),
    socials,
    hasContactForm,
  };
}

function addEmailIfValid(
  candidate: string,
  baseHost: string,
  bucket: Set<string>
) {
  const email = candidate.toLowerCase().trim();
  if (!email.includes("@")) return;
  if (email.length > 80) return;
  const [local, domain] = email.split("@");
  if (!local || !domain) return;
  if (IGNORED_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) {
    return;
  }
  if (/^(sentry|noreply|no-reply|donotreply|wordpress|admin@wp)/.test(local)) {
    return;
  }
  if (/(\.png|\.jpg|\.jpeg|\.svg|\.gif|\.webp)$/i.test(email)) return;
  if (domain === baseHost || domain.endsWith(`.${baseHost}`) || !baseHost) {
    bucket.add(email);
  } else if (/info|hello|contact|sales|support|hi|bonjour/i.test(local)) {
    bucket.add(email);
  }
}

function cleanPhone(raw: string): string | null {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.length >= 10) {
      return prettyPhone(cleaned);
    }
    return null;
  }
  if (cleaned.length < 8 || cleaned.length > 17) return null;
  return prettyPhone(cleaned);
}

function prettyPhone(digits: string): string {
  if (digits.startsWith("+")) {
    return digits.replace(
      /^(\+\d{1,3})(\d{1,4})(\d{1,4})(\d{1,4})(\d{0,4})$/,
      (_, a, b, c, d, e) => [a, b, c, d, e].filter(Boolean).join(" ")
    );
  }
  return digits.replace(
    /^(\d{2,3})(\d{2,4})(\d{2,4})(\d{2,4})(\d{0,4})$/,
    (_, a, b, c, d, e) => [a, b, c, d, e].filter(Boolean).join(" ")
  );
}

function collectSocials(externalLinks: string[]): SocialLink[] {
  const found = new Map<SocialPlatform, string>();
  for (const link of externalLinks) {
    let parsed: URL;
    try {
      parsed = new URL(link);
    } catch {
      continue;
    }
    const host = parsed.hostname.replace(/^www\./, "");
    const platform = SOCIAL_HOSTS[host];
    if (!platform) continue;
    if (SOCIAL_BLOCKLIST.some((b) => parsed.pathname.includes(b))) continue;
    if (parsed.pathname === "/" || parsed.pathname === "") continue;
    if (!found.has(platform)) {
      found.set(platform, parsed.toString());
    }
  }
  return Array.from(found.entries()).map(([platform, url]) => ({
    platform,
    url,
  }));
}
