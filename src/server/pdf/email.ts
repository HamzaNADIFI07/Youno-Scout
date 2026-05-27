import { Resend } from "resend";
import type { AnalysisResult } from "@/lib/types";

class EmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigError";
  }
}

let cachedClient: Resend | null = null;
function getResendClient(): Resend {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new EmailConfigError("RESEND_API_KEY manquant.");
  }
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

function getFromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new EmailConfigError("RESEND_FROM_EMAIL manquant.");
  }
  return `Scout <${from}>`;
}

export async function sendReportPdfEmail(input: {
  to: string;
  result: AnalysisResult;
  pdfBuffer: Buffer;
  fileName: string;
}): Promise<void> {
  const resend = getResendClient();
  const html = renderHtml({
    companyName: input.result.company.name,
    score: input.result.icp.total,
    verdict: input.result.icp.verdict,
  });

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: `Votre rapport Scout — ${input.result.company.name}`,
    html,
    text: renderText({
      companyName: input.result.company.name,
      score: input.result.icp.total,
    }),
    attachments: [
      {
        filename: input.fileName,
        content: input.pdfBuffer,
      },
    ],
    replyTo: process.env.RESEND_FROM_EMAIL,
  });

  if (error) {
    throw new Error(`Resend a échoué : ${error.message ?? "erreur inconnue"}`);
  }
}

function renderText(input: { companyName: string; score: number }): string {
  return [
    "Bonjour,",
    "",
    `Voici votre rapport Scout pour ${input.companyName}.`,
    `Score ICP : ${input.score} / 100.`,
    "",
    "Le PDF complet est joint à cet email.",
    "",
    "— L'équipe Scout × Youno",
    "You know. We build.",
  ].join("\n");
}

function renderHtml(input: {
  companyName: string;
  score: number;
  verdict: string;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const logo = `${appUrl.replace(/\/$/, "")}/youno-logo.png`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>Votre rapport Scout</title>
<style>
  body { margin:0; padding:0; background-color:#F5F5EB; }
  .wrapper { width:100%; background-color:#F5F5EB; padding:24px 12px; }
  .container { max-width:600px; margin:0 auto; }
  .card { background-color:#FFFFFF; border:1px solid rgba(35,19,18,0.08); border-radius:12px; padding:32px; }
  h1 { font-family:'Instrument Sans', Helvetica, Arial, sans-serif; font-weight:700; font-size:26px; line-height:1.2; color:#231312; margin:0 0 8px 0; letter-spacing:-0.4px; }
  .lead { font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:16px; line-height:1.5; color:#231312; opacity:0.85; margin:0 0 24px 0; }
  p { font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:#231312; margin:0 0 14px 0; }
  .score-card { background-color:#FFF1EA; border-radius:10px; padding:18px; text-align:center; margin:24px 0; }
  .score-num { font-family:'Instrument Sans', Helvetica, Arial, sans-serif; font-weight:800; font-size:48px; color:#CE562F; line-height:1; margin:0; }
  .score-label { font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; color:#231312; opacity:0.65; text-transform:uppercase; letter-spacing:1.4px; margin:4px 0 0 0; }
  .verdict { font-family:'Instrument Sans', Helvetica, Arial, sans-serif; font-weight:600; font-size:14px; color:#231312; margin:8px 0 0 0; }
  .meta { font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; color:#231312; opacity:0.55; text-align:right; padding-bottom:16px; }
  .logo { text-align:center; padding:8px 0 24px 0; }
  .logo img { display:inline-block; height:34px; max-width:200px; border:0; }
  .footer { font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; color:#231312; opacity:0.6; text-align:center; padding:24px 0 8px 0; }
  .footer .brand { font-style:italic; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="meta">Scout × Youno — votre rapport en pièce jointe</div>
      <div class="logo">
        <img src="${logo}" alt="Youno" width="200" height="34" />
      </div>
      <div class="card">
        <h1>Votre rapport Scout est prêt.</h1>
        <p class="lead">${escapeHtml(input.companyName)}</p>
        <div class="score-card">
          <p class="score-num">${input.score}<span style="font-size:22px;color:#231312;opacity:0.55;">/100</span></p>
          <p class="score-label">Score ICP — SaaS B2B mid-market</p>
          <p class="verdict">${verdictLabel(input.verdict)}</p>
        </div>
        <p>Bonjour,</p>
        <p>
          Vous trouverez en pièce jointe le rapport complet de votre analyse Scout pour
          <strong>${escapeHtml(input.companyName)}</strong> :
          brief commercial, score ICP détaillé, signaux GTM, stack technique,
          contacts et informations juridiques.
        </p>
        <p style="font-size:13px;color:#231312;opacity:0.65;margin-top:24px;">
          Bonne lecture — et bonne prospection.
        </p>
      </div>
      <div class="footer">
        Scout — un module Konsole / Youno.<br />
        <span class="brand">You know. We build.</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function verdictLabel(verdict: string): string {
  switch (verdict) {
    case "strong-fit":
      return "Strong fit — prioriser immédiatement";
    case "good-fit":
      return "Good fit — bon prospect, à qualifier";
    case "partial-fit":
      return "Partial fit — match partiel, à creuser";
    default:
      return "Poor fit — peu prioritaire";
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
