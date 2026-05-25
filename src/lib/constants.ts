import type { SignalId, TechCategory } from "@/lib/types";

export const USER_AGENT =
  "Mozilla/5.0 (compatible; ScoutBot/1.0; +https://scout.local/bot)";

export const FETCH_TIMEOUT_MS = 12_000;

export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export const MAX_HTML_BYTES = 4_000_000;

export const MAX_TEXT_CHARS_FOR_LLM = 8_000;

export const SECONDARY_PATHS = [
  "/about",
  "/pricing",
  "/customers",
  "/careers",
] as const;

type TechPattern = {
  name: string;
  category: TechCategory;
  patterns: RegExp[];
  headers?: Record<string, RegExp>;
};

export const TECH_PATTERNS: TechPattern[] = [
  {
    name: "Next.js",
    category: "framework",
    patterns: [/__NEXT_DATA__/i, /\/_next\//i],
    headers: { "x-powered-by": /next\.js/i },
  },
  {
    name: "Nuxt",
    category: "framework",
    patterns: [/__NUXT__/i, /\/_nuxt\//i],
  },
  {
    name: "Astro",
    category: "framework",
    patterns: [/astro-island/i, /\/_astro\//i],
  },
  {
    name: "Svelte",
    category: "framework",
    patterns: [/sveltekit-/i, /data-sveltekit/i],
  },
  {
    name: "Remix",
    category: "framework",
    patterns: [/__remixContext/i, /data-route/i],
  },
  {
    name: "React",
    category: "framework",
    patterns: [/data-reactroot/i, /react-dom/i],
  },
  {
    name: "Vue",
    category: "framework",
    patterns: [/data-v-app/i, /vue\.runtime/i],
  },
  {
    name: "Angular",
    category: "framework",
    patterns: [/ng-version=/i, /ng-app=/i],
  },
  {
    name: "Webflow",
    category: "cms",
    patterns: [/webflow\.com/i, /w-mod-/i],
    headers: { "x-powered-by": /webflow/i },
  },
  {
    name: "WordPress",
    category: "cms",
    patterns: [/wp-content/i, /wp-includes/i],
  },
  {
    name: "Shopify",
    category: "cms",
    patterns: [/cdn\.shopify\.com/i, /Shopify\.theme/i],
  },
  {
    name: "Framer",
    category: "cms",
    patterns: [/framerusercontent\.com/i, /data-framer-/i],
  },
  {
    name: "Squarespace",
    category: "cms",
    patterns: [/squarespace\.com/i, /Static\.SQUARESPACE_CONTEXT/i],
  },
  {
    name: "Wix",
    category: "cms",
    patterns: [/static\.wixstatic\.com/i, /wix-code/i],
  },
  {
    name: "Vercel",
    category: "hosting",
    patterns: [],
    headers: { server: /vercel/i, "x-vercel-cache": /.*/i },
  },
  {
    name: "Netlify",
    category: "hosting",
    patterns: [],
    headers: { server: /netlify/i, "x-nf-request-id": /.*/i },
  },
  {
    name: "Cloudflare",
    category: "hosting",
    patterns: [],
    headers: { server: /cloudflare/i, "cf-ray": /.*/i },
  },
  {
    name: "AWS CloudFront",
    category: "hosting",
    patterns: [],
    headers: { "x-amz-cf-id": /.*/i },
  },
  {
    name: "Google Analytics",
    category: "analytics",
    patterns: [/googletagmanager\.com/i, /gtag\(/i, /ga\('create'/i],
  },
  {
    name: "Segment",
    category: "analytics",
    patterns: [/cdn\.segment\.com/i, /analytics\.load\(/i],
  },
  {
    name: "Mixpanel",
    category: "analytics",
    patterns: [/cdn\.mxpnl\.com/i, /mixpanel\.init/i],
  },
  {
    name: "PostHog",
    category: "analytics",
    patterns: [/posthog\.com\/static/i, /posthog\.init/i],
  },
  {
    name: "Amplitude",
    category: "analytics",
    patterns: [/amplitude\.com\/libs/i, /amplitude\.init/i],
  },
  {
    name: "Plausible",
    category: "analytics",
    patterns: [/plausible\.io\/js/i],
  },
  {
    name: "Hotjar",
    category: "analytics",
    patterns: [/static\.hotjar\.com/i, /hjSetting/i],
  },
  {
    name: "Fathom",
    category: "analytics",
    patterns: [/cdn\.usefathom\.com/i],
  },
  {
    name: "HubSpot",
    category: "marketing",
    patterns: [/js\.hs-scripts\.com/i, /hubspotusercontent/i, /hsforms/i],
  },
  {
    name: "Marketo",
    category: "marketing",
    patterns: [/munchkin\.marketo\.net/i, /mktoresp\.com/i],
  },
  {
    name: "Pardot",
    category: "marketing",
    patterns: [/pi\.pardot\.com/i],
  },
  {
    name: "Customer.io",
    category: "marketing",
    patterns: [/customer\.io\/track/i, /cdp\.customer\.io/i],
  },
  {
    name: "Klaviyo",
    category: "marketing",
    patterns: [/klaviyo\.com\/onsite/i, /static\.klaviyo\.com/i],
  },
  {
    name: "Intercom",
    category: "support",
    patterns: [/widget\.intercom\.io/i, /intercomSettings/i],
  },
  {
    name: "Crisp",
    category: "support",
    patterns: [/client\.crisp\.chat/i, /\$crisp/i],
  },
  {
    name: "Drift",
    category: "support",
    patterns: [/js\.driftt\.com/i, /drift\.load/i],
  },
  {
    name: "Zendesk",
    category: "support",
    patterns: [/zdassets\.com/i, /static\.zdassets\.com/i, /zopim\.com/i],
  },
  {
    name: "Help Scout",
    category: "support",
    patterns: [/beacon-v2\.helpscout\.net/i],
  },
  {
    name: "Tidio",
    category: "support",
    patterns: [/code\.tidio\.co/i],
  },
  {
    name: "Stripe",
    category: "payment",
    patterns: [/js\.stripe\.com/i, /Stripe\(/i],
  },
  {
    name: "PayPal",
    category: "payment",
    patterns: [/www\.paypal\.com\/sdk/i, /paypalobjects\.com/i],
  },
  {
    name: "Paddle",
    category: "payment",
    patterns: [/paddle\.com\/build/i, /Paddle\.Setup/i],
  },
  {
    name: "Lemon Squeezy",
    category: "payment",
    patterns: [/lemonsqueezy\.com/i],
  },
];

type SignalDefinition = {
  id: SignalId;
  label: string;
  category: "maturity" | "go-to-market" | "product" | "growth";
  weight: number;
};

export const SIGNAL_DEFINITIONS: SignalDefinition[] = [
  {
    id: "contact-email",
    label: "Email de contact public",
    category: "go-to-market",
    weight: 8,
  },
  {
    id: "contact-phone",
    label: "Téléphone public",
    category: "go-to-market",
    weight: 6,
  },
  {
    id: "contact-form",
    label: "Formulaire de contact",
    category: "go-to-market",
    weight: 4,
  },
  {
    id: "enterprise-tier",
    label: "Offre Enterprise",
    category: "maturity",
    weight: 10,
  },
  {
    id: "case-studies",
    label: "Études de cas publiées",
    category: "maturity",
    weight: 6,
  },
  {
    id: "compliance-badges",
    label: "Conformité (SOC 2, ISO, RGPD…)",
    category: "maturity",
    weight: 8,
  },
  {
    id: "active-careers",
    label: "Recrutement actif",
    category: "growth",
    weight: 10,
  },
  {
    id: "funding-mention",
    label: "Levée de fonds mentionnée",
    category: "growth",
    weight: 10,
  },
  {
    id: "international-presence",
    label: "Présence internationale",
    category: "growth",
    weight: 5,
  },
  {
    id: "public-pricing",
    label: "Page de tarifs publique",
    category: "go-to-market",
    weight: 4,
  },
  {
    id: "developer-docs",
    label: "Documentation API publique",
    category: "product",
    weight: 5,
  },
  {
    id: "modern-stack",
    label: "Stack moderne détectée",
    category: "product",
    weight: 4,
  },
];

export const ICP_MAX_SCORE = 100;
export const ICP_SIGNALS_MAX = 40;
export const ICP_BUSINESS_MODEL_MAX = 35;
export const ICP_TECH_MAX = 15;
export const ICP_MATURITY_MAX = 10;
