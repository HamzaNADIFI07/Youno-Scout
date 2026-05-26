import { Resend } from "resend";

export class EmailConfigError extends Error {
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
    throw new EmailConfigError(
      "RESEND_API_KEY manquant. Configurez-le dans .env.local."
    );
  }
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

function getFromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new EmailConfigError(
      "RESEND_FROM_EMAIL manquant. Configurez-le dans .env.local."
    );
  }
  return `Scout <${from}>`;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function sendVerificationEmail(input: {
  to: string;
  verificationToken: string;
}): Promise<void> {
  const resend = getResendClient();
  const link = `${getAppUrl()}/api/verify?token=${encodeURIComponent(
    input.verificationToken
  )}`;

  const html = renderVerificationHtml({ link });
  const text = renderVerificationText({ link });

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: "Confirmez votre adresse pour lancer votre analyse Scout",
    html,
    text,
    replyTo: process.env.RESEND_FROM_EMAIL,
  });

  if (error) {
    throw new Error(`Resend a échoué : ${error.message ?? "erreur inconnue"}`);
  }
}

function renderVerificationText({ link }: { link: string }): string {
  return [
    "Bonjour,",
    "",
    "Vous venez de demander une analyse sur Scout, l'outil de qualification GTM signé Youno.",
    "",
    "Pour lancer votre analyse, confirmez votre adresse email en cliquant sur le lien ci-dessous :",
    link,
    "",
    "Une fois confirmée, revenez sur Scout — vous pourrez lancer l'analyse en un clic.",
    "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.",
    "",
    "— L'équipe Scout × Youno",
    "You know. We build.",
  ].join("\n");
}

function renderVerificationHtml({ link }: { link: string }): string {
  const logoUrl = `${getAppUrl().replace(/\/$/, "")}/youno-logo.png`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>Confirmez votre adresse</title>
<style>
  body { margin:0; padding:0; background-color:#F5F5EC; }
  .wrapper { width:100%; background-color:#F5F5EC; padding:24px 12px; }
  .container { max-width:600px; margin:0 auto; background-color:#F5F5EC; border-radius:10px; }
  .logo-wrap { text-align:center; padding:8px 0 24px 0; }
  .logo-wrap img { display:inline-block; width:auto; height:34px; max-width:200px; border:0; outline:none; text-decoration:none; }
  .card { background-color:#FFFFFF; border:1px solid rgba(35,19,18,0.08); border-radius:12px; padding:32px; }
  h1 { font-family:'Instrument Sans', Helvetica, Arial, sans-serif; font-weight:700; font-size:28px; line-height:1.2; color:#231312; margin:0 0 8px 0; letter-spacing:-0.5px; }
  .lead { font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:18px; line-height:1.5; color:#231312; opacity:0.85; margin:0 0 28px 0; }
  p { font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:16px; line-height:1.6; color:#231312; margin:0 0 16px 0; }
  .cta-wrap { text-align:center; margin:32px 0; }
  .cta { display:inline-block; background-color:#CC532B; color:#FFFFFF !important; text-decoration:none; font-family:'DM Sans', Helvetica, Arial, sans-serif; font-weight:700; font-size:15px; padding:14px 28px; border-radius:10px; border:1px solid #231312; box-shadow:0 4px 12px -2px rgba(204,83,43,0.35); }
  .divider { border:none; border-top:2px solid #231312; opacity:0.15; margin:32px 0; }
  .fallback { font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:13px; line-height:1.5; color:#231312; opacity:0.7; word-break:break-all; }
  .fallback a { color:#CC532B; text-decoration:underline; }
  .footer { font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; color:#231312; opacity:0.6; text-align:center; padding:24px 0 8px 0; }
  .footer .brand { font-style:italic; }
  @media only screen and (max-width:520px) {
    .card { padding:24px; }
    h1 { font-size:24px; }
    .lead { font-size:16px; }
    .logo-wrap img { height:30px; }
  }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-wrap">
        <img src="${logoUrl}" alt="Youno" width="200" height="34" />
      </div>
      <div class="card">
        <h1>Confirmez votre adresse pour lancer votre analyse.</h1>
        <p class="lead">Plus qu'une étape avant de découvrir votre rapport GTM.</p>

        <p>Bonjour,</p>
        <p>
          Vous venez de demander une analyse sur <strong>Scout</strong>, l'outil de
          qualification GTM signé Youno. Confirmez votre adresse email en cliquant sur
          le bouton ci-dessous, puis revenez sur Scout pour lancer votre rapport.
        </p>

        <div class="cta-wrap">
          <a class="cta" href="${link}">Confirmer mon adresse</a>
        </div>

        <hr class="divider" />

        <p class="fallback">
          Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br />
          <a href="${link}">${link}</a>
        </p>

        <p class="fallback" style="margin-top:24px;">
          Vous n'êtes pas à l'origine de cette demande ? Vous pouvez ignorer ce message en toute sécurité.
        </p>
      </div>
      <div class="footer">
        Scout est un module candidat pour Konsole — Youno.<br />
        <span class="brand">You know. We build.</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}
