import pino from "pino";

const isProduction =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const isPreview = process.env.VERCEL_ENV === "preview";

// En dev local : sortie lisible (pino-pretty). En prod/preview Vercel : JSON brut,
// capturé automatiquement par Vercel Runtime Logs et drainable vers Axiom / Datadog
// via Vercel Log Drains (cf. README, section "Observabilité").
const transport = isProduction || isPreview
  ? undefined
  : {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss.l",
        ignore: "pid,hostname,service,env",
        singleLine: false,
      },
    };

export const logger = pino({
  level:
    process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  transport,
  base: {
    service: "scout",
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  },
  // Redaction : si jamais un champ sensible se glisse dans un log, on le masque
  // côté pino plutôt que d'espérer ne jamais en logger.
  redact: {
    paths: [
      "password",
      "token",
      "secret",
      "apiKey",
      "api_key",
      "Authorization",
      "authorization",
      "headers.authorization",
      "headers.cookie",
      "*.password",
      "*.token",
      "*.secret",
      "*.apiKey",
    ],
    censor: "[REDACTED]",
  },
  // Sérialisation des erreurs : stack + code + message structurés
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
});

/**
 * Renvoie un logger enfant enrichi avec le request_id propagé via le middleware
 * Next.js. Utiliser ce logger dans toutes les routes API pour corréler les logs
 * d'une même requête.
 */
export function requestLogger(request: Request): pino.Logger {
  const requestId =
    request.headers.get("x-request-id") ??
    request.headers.get("x-vercel-id") ??
    "no-request-id";
  return logger.child({ requestId });
}
