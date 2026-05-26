import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

/**
 * Rate limiting des routes API par IP.
 *
 * Backend : Upstash Redis (free tier 10 000 commandes/jour, intégration Vercel
 * native). Si les variables d'env ne sont pas configurées, le rate limiting
 * est désactivé (utile pour le dev local sans dépendance externe).
 *
 * Stratégie : sliding window (plus fluide qu'un fixed window), par IP cliente
 * lue depuis `x-forwarded-for` ou `x-real-ip` (Vercel pose ces headers).
 *
 * Quotas par défaut (voir LIMITS ci-dessous) :
 *  - analyze         : 10 / heure  (coûteux en tokens LLM)
 *  - generate-signals: 10 / heure  (coûteux en tokens LLM)
 *  - subscribe       : 5  / heure  (anti-spam Resend + DB)
 *  - me              : 60 / minute (très bon marché, juste pour bloquer le scan)
 */

type LimitKey = "analyze" | "generate-signals" | "subscribe" | "me";

type LimitConfig = {
  requests: number;
  windowSeconds: number;
};

const LIMITS: Record<LimitKey, LimitConfig> = {
  analyze: { requests: 10, windowSeconds: 60 * 60 },
  "generate-signals": { requests: 10, windowSeconds: 60 * 60 },
  subscribe: { requests: 5, windowSeconds: 60 * 60 },
  me: { requests: 60, windowSeconds: 60 },
};

const cachedRedis: { instance: Redis | null } = { instance: null };
const cachedLimiters = new Map<LimitKey, Ratelimit>();

function getRedis(): Redis | null {
  if (cachedRedis.instance) return cachedRedis.instance;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  cachedRedis.instance = new Redis({ url, token });
  return cachedRedis.instance;
}

function getLimiter(key: LimitKey): Ratelimit | null {
  if (cachedLimiters.has(key)) return cachedLimiters.get(key)!;
  const redis = getRedis();
  if (!redis) return null;
  const { requests, windowSeconds } = LIMITS[key];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    prefix: `scout:rl:${key}`,
    analytics: true,
  });
  cachedLimiters.set(key, limiter);
  return limiter;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export type RateLimitVerdict =
  | { ok: true }
  | {
      ok: false;
      retryAfterSeconds: number;
      limit: number;
      remaining: number;
      resetAt: number;
    };

/**
 * Vérifie le quota pour une route donnée. Renvoie `{ ok: true }` si autorisé,
 * sinon `{ ok: false, retryAfterSeconds, ... }`. Si Upstash n'est pas configuré
 * (dev local sans variables), renvoie toujours `{ ok: true }` avec un avertissement.
 */
export async function checkRateLimit(
  key: LimitKey,
  request: Request
): Promise<RateLimitVerdict> {
  const limiter = getLimiter(key);
  if (!limiter) {
    // Dev local sans Upstash : on ne bloque pas, mais on logue une fois pour
    // que ça ne passe pas en silence.
    if (process.env.NODE_ENV !== "production") {
      logger.debug(
        { route: key },
        "rate limit skipped (UPSTASH_REDIS_REST_URL non configuré)"
      );
    }
    return { ok: true };
  }

  const ip = getClientIp(request);
  const identifier = `${key}:${ip}`;
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    logger.warn(
      { route: key, ip, retryAfterSeconds, limit },
      "rate limit hit"
    );
    return {
      ok: false,
      retryAfterSeconds,
      limit,
      remaining,
      resetAt: reset,
    };
  }

  return { ok: true };
}
