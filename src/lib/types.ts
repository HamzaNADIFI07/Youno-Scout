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
  "public-pricing",
  "enterprise-tier",
  "api-or-integrations",
  "customer-logos",
  "case-studies",
  "active-careers",
  "compliance-badges",
  "multilingual",
  "blog-active",
  "newsletter-signup",
  "live-chat",
  "open-graph-set",
]);
export type SignalId = z.infer<typeof SignalIdSchema>;

export const SignalSchema = z.object({
  id: SignalIdSchema,
  label: z.string(),
  category: z.enum(["maturity", "go-to-market", "product", "growth"]),
  detected: z.boolean(),
  weight: z.number(),
  selected: z.boolean(),
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

export const AnalysisResultSchema = z.object({
  url: z.string().url(),
  finalUrl: z.string().url(),
  fetchedAt: z.string(),
  durationMs: z.number(),
  company: LlmCompanyInsightSchema,
  techStack: TechStackSchema,
  signals: z.array(SignalSchema),
  icp: IcpScoreSchema,
  meta: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    favicon: z.string().optional(),
    ogImage: z.string().optional(),
    language: z.string().optional(),
  }),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const AnalyzeRequestSchema = z.object({
  url: z
    .string()
    .min(3)
    .max(2048)
    .transform((value) => value.trim()),
  selectedSignals: z.array(SignalIdSchema).optional(),
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
