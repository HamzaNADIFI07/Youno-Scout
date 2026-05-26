import { randomBytes } from "node:crypto";
import { getDbClient } from "@/lib/db";

export type Subscriber = {
  id: string;
  email: string;
  verificationToken: string;
  verified: boolean;
  acceptedMarketing: boolean;
  acceptedTerms: boolean;
  createdAt: string;
  verifiedAt: string | null;
};

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

type Row = Record<string, unknown>;

function mapRow(row: Row): Subscriber {
  return {
    id: String(row.id),
    email: String(row.email),
    verificationToken: String(row.verification_token),
    verified: Boolean(row.verified),
    acceptedMarketing: Boolean(row.accepted_marketing),
    acceptedTerms: Boolean(row.accepted_terms),
    createdAt: String(row.created_at),
    verifiedAt: row.verified_at ? String(row.verified_at) : null,
  };
}

export async function upsertSubscriber(input: {
  email: string;
  acceptedMarketing: boolean;
  acceptedTerms: boolean;
  ipAddress?: string;
}): Promise<Subscriber> {
  const sql = getDbClient();
  const token = generateToken();

  const rows = (await sql`
    INSERT INTO email_subscribers (email, verification_token, accepted_marketing, accepted_terms, ip_address)
    VALUES (${input.email}, ${token}, ${input.acceptedMarketing}, ${input.acceptedTerms}, ${input.ipAddress ?? null})
    ON CONFLICT (email) DO UPDATE
    SET verification_token = CASE
          WHEN email_subscribers.verified THEN email_subscribers.verification_token
          ELSE EXCLUDED.verification_token
        END,
        accepted_marketing = EXCLUDED.accepted_marketing,
        accepted_terms = EXCLUDED.accepted_terms
    RETURNING *
  `) as Row[];

  return mapRow(rows[0]);
}

export async function findSubscriberByToken(
  token: string
): Promise<Subscriber | null> {
  const sql = getDbClient();
  const rows = (await sql`
    SELECT * FROM email_subscribers WHERE verification_token = ${token} LIMIT 1
  `) as Row[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function findSubscriberByEmail(
  email: string
): Promise<Subscriber | null> {
  const sql = getDbClient();
  const rows = (await sql`
    SELECT * FROM email_subscribers WHERE email = ${email} LIMIT 1
  `) as Row[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function markSubscriberVerified(
  token: string
): Promise<Subscriber | null> {
  const sql = getDbClient();
  const rows = (await sql`
    UPDATE email_subscribers
    SET verified = TRUE, verified_at = NOW()
    WHERE verification_token = ${token}
    RETURNING *
  `) as Row[];
  return rows[0] ? mapRow(rows[0]) : null;
}
