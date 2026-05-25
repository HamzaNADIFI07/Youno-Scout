import * as cheerio from "cheerio";
import type { LegalInfo } from "@/lib/types";

const LEGAL_PATH_PATTERNS = [
  /\/mentions[-_]?l[ée]gales?/i,
  /\/legal[-_]?notice/i,
  /\/legal-info/i,
  /\/legal$/i,
  /\/cgu/i,
  /\/cgv/i,
  /\/conditions[-_]?g[ée]n[ée]rales/i,
  /\/imprint/i,
  /\/about\/legal/i,
];

export function findLegalPagePath(internalLinks: string[]): string | undefined {
  for (const link of internalLinks) {
    if (LEGAL_PATH_PATTERNS.some((re) => re.test(link))) {
      return link;
    }
  }
  return undefined;
}

export function extractLegalInfo(input: {
  html: string;
  pageUrl?: string;
}): LegalInfo {
  const $ = cheerio.load(input.html);
  $("script, style, noscript, svg, path").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();

  return {
    legalName: matchLegalName(text),
    legalForm: matchLegalForm(text),
    registrationNumber: matchRegistrationNumber(text),
    vatNumber: matchVatNumber(text),
    shareCapital: matchShareCapital(text),
    rcs: matchRcs(text),
    headquartersAddress: matchHeadquartersAddress(text),
    publicationDirector: matchPublicationDirector(text),
    hostingProvider: matchHostingProvider(text),
    legalPageUrl: input.pageUrl,
  };
}

function matchLegalName(text: string): string | undefined {
  const patterns = [
    /(?:raison sociale|d[ée]nomination(?: sociale)?|nom de l['’]entreprise)\s*[:\-]?\s*([A-Z][\wÀ-ÿ&.\-' ]{2,60}?)(?=\s*(?:[,.;\n]|capital|si[èe]ge|rcs|siret|siren))/i,
    /(?:Soci[ée]t[ée])\s+([A-Z][\wÀ-ÿ&.\-' ]{2,40})(?:\s+SAS|\s+SARL|\s+SA\b|\s+EURL|\s+SASU)/,
  ];
  for (const re of patterns) {
    const match = text.match(re);
    if (match) return clean(match[1]);
  }
  return undefined;
}

function matchLegalForm(text: string): string | undefined {
  const forms = [
    "SASU",
    "SAS",
    "SARL",
    "EURL",
    "SA",
    "SCA",
    "SCS",
    "SCI",
    "SCM",
    "SCP",
    "SELARL",
    "GIE",
    "GmbH",
    "AG",
    "Ltd",
    "LLC",
    "Inc.",
    "Inc",
    "Corp.",
    "Corp",
    "PLC",
    "BV",
    "NV",
    "AB",
    "Oy",
  ];
  const sortedForms = [...forms].sort((a, b) => b.length - a.length);
  for (const form of sortedForms) {
    const escapedForm = form.replace(/\./g, "\\.");
    const re = new RegExp(`\\b${escapedForm}\\b`, "i");
    if (re.test(text)) {
      return form;
    }
  }
  return undefined;
}

function matchRegistrationNumber(text: string): string | undefined {
  const siretMatch = text.match(/\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/);
  if (siretMatch) {
    return `SIRET ${siretMatch[1].replace(/\s+/g, " ")}`;
  }
  const sirenMatch = text.match(/(?:siren|RCS[^0-9]{1,20})(\d{3}\s?\d{3}\s?\d{3})\b/i);
  if (sirenMatch) {
    return `SIREN ${sirenMatch[1].replace(/\s+/g, " ")}`;
  }
  return undefined;
}

function matchVatNumber(text: string): string | undefined {
  const re = /\b(FR\s?\d{2}\s?\d{9}|[A-Z]{2}\s?[A-Z0-9]{8,12})\b/;
  const match = text.match(re);
  if (match) return clean(match[1]);
  return undefined;
}

function matchShareCapital(text: string): string | undefined {
  const re =
    /(?:capital social|capital)\s*(?:de|d'un montant de|s['’]?[ée]levant à)?\s*[:\-]?\s*([\d\s.,]+(?:[ ,.]?\d{3})*\s*(?:€|euros?|EUR|USD|\$))/i;
  const match = text.match(re);
  if (match) return clean(match[1]);
  return undefined;
}

function matchRcs(text: string): string | undefined {
  const re = /RCS\s+([A-ZÀ-ÿa-z\- ]+?)\s+(\d{3}\s?\d{3}\s?\d{3})/;
  const match = text.match(re);
  if (match) return `RCS ${clean(match[1])} ${match[2].replace(/\s+/g, " ")}`;
  return undefined;
}

function matchHeadquartersAddress(text: string): string | undefined {
  const patterns = [
    /(?:si[èe]ge\s+social|adresse\s+du\s+si[èe]ge|adresse\s+postale|headquarters?|registered\s+office)\s*[:\-]?\s*([\d][\d\w\sÀ-ÿ.\-,'’]{10,200})/i,
    /(\d{1,4}\s?(?:rue|avenue|av\.|bd|boulevard|place|impasse|chemin|allée)\s+[\wÀ-ÿ.\-'’ ]{3,80}\s+\d{4,5}\s+[\wÀ-ÿ.\-' ]{2,40})/i,
  ];
  for (const re of patterns) {
    const match = text.match(re);
    if (match) {
      return truncateAddress(clean(match[1]));
    }
  }
  return undefined;
}

const ADDRESS_STOP_WORDS = [
  "Adresse e-mail",
  "Adresse email",
  "Adresse mail",
  "E-mail",
  "Email",
  "Téléphone",
  "Telephone",
  "Tél",
  "Tel",
  "RCS",
  "SIRET",
  "SIREN",
  "Capital",
  "TVA",
  "VAT",
  "Représentée",
  "Représenté",
  "Directeur",
  "Hébergeur",
  "Hébergement",
];

function truncateAddress(value: string): string {
  let result = value;
  for (const stop of ADDRESS_STOP_WORDS) {
    const idx = result.toLowerCase().indexOf(stop.toLowerCase());
    if (idx > 10) {
      result = result.slice(0, idx).trim();
    }
  }
  result = result.replace(/[,;.\s]+$/, "");
  return result.slice(0, 200);
}

function matchPublicationDirector(text: string): string | undefined {
  const re =
    /(?:directeur\s+(?:de\s+(?:la\s+)?publication|de\s+la\s+r[ée]daction)|publication\s+director)(?:\s+est|\s+:|\s*-|\s*–|\s+)\s*([A-ZÀ-ÿ][\wÀ-ÿ.\-'’]+(?:\s+[A-ZÀ-ÿ][\wÀ-ÿ.\-'’]+){0,3})/i;
  const match = text.match(re);
  if (match) return cleanLeadingWords(clean(match[1]).split(/[,.;]/)[0]);
  return undefined;
}

function matchHostingProvider(text: string): string | undefined {
  const re =
    /(?:h[ée]berg(?:eur|é\s+par|ement)|hosted\s+by|hosting\s+provider)(?:\s+est|\s+:|\s*-|\s*–|\s+par)?\s+([A-ZÀ-ÿ][\wÀ-ÿ.\-'’]+(?:\s+[A-ZÀ-ÿ0-9.\-'’]+){0,4})/i;
  const match = text.match(re);
  if (match) return cleanLeadingWords(clean(match[1]).split(/[,.;]/)[0]);
  return undefined;
}

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

const LEADING_NOISE = new Set([
  "le",
  "la",
  "les",
  "est",
  "par",
  "site",
  "société",
  "société",
  "the",
  "is",
  "by",
]);

function cleanLeadingWords(value: string): string {
  const parts = value.split(/\s+/);
  while (parts.length > 0 && LEADING_NOISE.has(parts[0].toLowerCase())) {
    parts.shift();
  }
  return parts.join(" ");
}
