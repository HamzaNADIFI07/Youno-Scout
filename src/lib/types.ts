import { z } from "zod";

export const CompanySizeSchema = z.enum([
  "startup",
  "smb",
  "mid-market",
  "enterprise",
  "unknown",
]);
export type CompanySize = z.infer<typeof CompanySizeSchema>;

export const BusinessModelSchema = z.enum([
  "b2b",
  "b2c",
  "b2b2c",
  "marketplace",
  "unknown",
]);
export type BusinessModel = z.infer<typeof BusinessModelSchema>;

export const LlmCompanyInsightSchema = z.object({
  name: z.string().describe("Official company name."),
  shortDescription: z
    .string()
    .describe("One sentence describing what the company does."),
  longDescription: z
    .string()
    .describe(
      "A short paragraph (3-5 sentences) explaining the value proposition and what the company sells."
    ),
  industry: z
    .string()
    .describe(
      "Industry vertical, lowercase, kebab-case style (eg. fintech, devtools, hr-tech, e-commerce)."
    ),
  businessModel: BusinessModelSchema,
  estimatedSize: CompanySizeSchema,
  targetAudience: z
    .string()
    .describe(
      "Who they sell to, in one short sentence (eg. mid-market SaaS companies)."
    ),
  valueProposition: z
    .string()
    .describe("The core promise of the company in one sentence."),
  pricingPublicly: z
    .boolean()
    .describe("True if a public pricing page or pricing information is visible."),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Confidence in the extraction quality, from 0 (very low) to 1 (very high)."
    ),
  people: z
    .array(
      z.object({
        fullName: z.string(),
        role: z.string().optional(),
      })
    )
    .max(20)
    .optional()
    .describe(
      "People explicitly mentioned on the page : founders, team members, testimonials. Empty array if none."
    ),
});
export type LlmCompanyInsight = z.infer<typeof LlmCompanyInsightSchema>;

export const TechItemSchema = z.object({
  name: z.string(),
  evidence: z.string().optional(),
});
export type TechItem = z.infer<typeof TechItemSchema>;

export const TechCategorySchema = z.enum([
  "framework",
  "analytics",
  "marketing",
  "support",
  "payment",
  "hosting",
  "cms",
  "other",
]);
export type TechCategory = z.infer<typeof TechCategorySchema>;

export const TechStackSchema = z.array(
  z.object({
    category: TechCategorySchema,
    items: z.array(TechItemSchema),
  })
);
export type TechStack = z.infer<typeof TechStackSchema>;

export const SignalIdSchema = z.enum([
  "crm-used",
  "tracking-stack",
  "marketing-automation",
  "sales-model",
  "public-pricing",
  "active-careers",
  "funding-mention",
  "international-presence",
  "compliance-badges",
  "case-studies",
]);
export type SignalId = z.infer<typeof SignalIdSchema>;

export const SignalSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(["maturity", "go-to-market", "product", "growth"]),
  detected: z.boolean(),
  weight: z.number(),
  selected: z.boolean(),
  value: z.string().optional(),
  evidence: z.string().optional(),
});
export type Signal = z.infer<typeof SignalSchema>;

export const ScoreBreakdownEntrySchema = z.object({
  category: z.string(),
  score: z.number(),
  maxScore: z.number(),
  reasoning: z.string(),
});
export type ScoreBreakdownEntry = z.infer<typeof ScoreBreakdownEntrySchema>;

export const IcpVerdictSchema = z.enum([
  "strong-fit",
  "good-fit",
  "partial-fit",
  "poor-fit",
]);
export type IcpVerdict = z.infer<typeof IcpVerdictSchema>;

export const IcpScoreSchema = z.object({
  total: z.number().min(0).max(100),
  verdict: IcpVerdictSchema,
  breakdown: z.array(ScoreBreakdownEntrySchema),
  rationale: z.string(),
});
export type IcpScore = z.infer<typeof IcpScoreSchema>;

export const SocialPlatformSchema = z.enum([
  "linkedin",
  "twitter",
  "github",
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
]);
export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;

export const SocialLinkSchema = z.object({
  platform: SocialPlatformSchema,
  url: z.string(),
});
export type SocialLink = z.infer<typeof SocialLinkSchema>;

export const ContactsSchema = z.object({
  emails: z.array(z.string()),
  phones: z.array(z.string()),
  socials: z.array(SocialLinkSchema),
  hasContactForm: z.boolean(),
});
export type Contacts = z.infer<typeof ContactsSchema>;

export const LegalInfoSchema = z.object({
  legalName: z.string().optional(),
  legalForm: z.string().optional(),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  shareCapital: z.string().optional(),
  rcs: z.string().optional(),
  headquartersAddress: z.string().optional(),
  publicationDirector: z.string().optional(),
  hostingProvider: z.string().optional(),
  legalPageUrl: z.string().optional(),
});
export type LegalInfo = z.infer<typeof LegalInfoSchema>;

export const PersonSchema = z.object({
  fullName: z.string(),
  role: z.string().optional(),
  source: z.string().optional(),
});
export type Person = z.infer<typeof PersonSchema>;

export const HunterContactSchema = z.object({
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  position: z.string().optional(),
  confidence: z.number().optional(),
  type: z.string().optional(),
});
export type HunterContact = z.infer<typeof HunterContactSchema>;

export const HunterEnrichmentSchema = z.object({
  domain: z.string().optional(),
  organization: z.string().optional(),
  emails: z.array(HunterContactSchema),
  pattern: z.string().optional(),
  totalEmailsFound: z.number().optional(),
});
export type HunterEnrichment = z.infer<typeof HunterEnrichmentSchema>;

export const CompanyEnrichmentSchema = z.object({
  name: z.string().optional(),
  legalName: z.string().optional(),
  domain: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  employees: z.string().optional(),
  founded: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
});
export type CompanyEnrichment = z.infer<typeof CompanyEnrichmentSchema>;

export const EnrichmentDataSchema = z.object({
  logoUrl: z.string().optional(),
  hunter: HunterEnrichmentSchema.optional(),
  companyEnrich: CompanyEnrichmentSchema.optional(),
  errors: z
    .array(
      z.object({
        api: z.enum(["clearbit-logo", "hunter", "company-enrich"]),
        message: z.string(),
      })
    )
    .optional(),
});
export type EnrichmentData = z.infer<typeof EnrichmentDataSchema>;

export const AnalysisResultSchema = z.object({
  url: z.string().url(),
  finalUrl: z.string().url(),
  fetchedAt: z.string(),
  durationMs: z.number(),
  company: LlmCompanyInsightSchema,
  techStack: TechStackSchema,
  signals: z.array(SignalSchema),
  contacts: ContactsSchema,
  legal: LegalInfoSchema,
  people: z.array(PersonSchema),
  icp: IcpScoreSchema,
  enrichment: EnrichmentDataSchema.optional(),
  meta: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    favicon: z.string().optional(),
    ogImage: z.string().optional(),
    language: z.string().optional(),
  }),
  mode: z.enum(["standard", "premium"]).optional(),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const CustomSignalCategorySchema = z.enum([
  "joignabilite",
  "maturite",
  "croissance",
  "produit",
  "fit",
]);
export type CustomSignalCategory = z.infer<typeof CustomSignalCategorySchema>;

export const CustomSignalDetectionSchema = z.object({
  keywords: z.array(z.string()).max(15),
  urlPatterns: z.array(z.string()).max(10),
});
export type CustomSignalDetection = z.infer<typeof CustomSignalDetectionSchema>;

export const CustomSignalSchema = z.object({
  id: z.string(),
  label: z.string().min(3).max(120),
  category: CustomSignalCategorySchema,
  weight: z.number().int().min(1).max(10),
  detection: CustomSignalDetectionSchema,
  rationale: z.string().min(5).max(400),
});
export type CustomSignal = z.infer<typeof CustomSignalSchema>;

export const GenerateSignalsRequestSchema = z.object({
  description: z.string().min(20).max(5000),
  targetUrl: z.string().max(2048).optional(),
  currentSignals: z.array(CustomSignalSchema).optional(),
  instruction: z.string().max(2000).optional(),
});
export type GenerateSignalsRequest = z.infer<typeof GenerateSignalsRequestSchema>;

export const GenerateSignalsResponseSchema = z.object({
  signals: z.array(CustomSignalSchema),
});
export type GenerateSignalsResponse = z.infer<typeof GenerateSignalsResponseSchema>;

export const EnabledApisSchema = z.object({
  clearbitLogo: z.boolean().optional(),
  hunter: z.boolean().optional(),
  companyEnrich: z.boolean().optional(),
});
export type EnabledApis = z.infer<typeof EnabledApisSchema>;

export const AnalyzeRequestSchema = z.object({
  url: z
    .string()
    .min(3)
    .max(2048)
    .transform((value) => value.trim()),
  selectedSignals: z.array(SignalIdSchema).optional(),
  customSignals: z.array(CustomSignalSchema).optional(),
  enabledApis: EnabledApisSchema.optional(),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const AnalyzeErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    "invalid-url",
    "fetch-failed",
    "timeout",
    "blocked",
    "llm-failed",
    "internal",
  ]),
});
export type AnalyzeError = z.infer<typeof AnalyzeErrorSchema>;
