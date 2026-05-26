import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "scout_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 an

export type SessionPayload = {
  /** UUID du subscriber dans email_subscribers */
  sid: string;
  /** Email vérifié (utile pour l'affichage côté UI) */
  email: string;
  /** Timestamp Unix d'émission, en secondes */
  iat: number;
};

function getSecret(): string {
  const secret = process.env.SCOUT_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SCOUT_SESSION_SECRET manquant ou trop court (min 32 caractères)."
    );
  }
  return secret;
}

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64url");
}

function fromBase64Url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function hmac(data: string): string {
  return toBase64Url(createHmac("sha256", getSecret()).update(data).digest());
}

export function signSession(payload: SessionPayload): string {
  const dataPart = toBase64Url(Buffer.from(JSON.stringify(payload)));
  const sigPart = hmac(dataPart);
  return `${dataPart}.${sigPart}`;
}

export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [dataPart, sigPart] = token.split(".");
  if (!dataPart || !sigPart) return null;

  let expected: string;
  try {
    expected = hmac(dataPart);
  } catch {
    return null;
  }

  const a = Buffer.from(sigPart);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(dataPart).toString("utf8"));
    if (
      typeof payload?.sid === "string" &&
      typeof payload?.email === "string" &&
      typeof payload?.iat === "number"
    ) {
      return payload as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}
