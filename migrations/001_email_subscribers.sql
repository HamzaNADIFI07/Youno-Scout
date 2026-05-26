-- Migration 001 : table email_subscribers
-- À exécuter une fois dans le SQL Editor de la console Neon.

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  verification_token VARCHAR(64) UNIQUE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_terms BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON email_subscribers (email);
CREATE INDEX IF NOT EXISTS idx_subscribers_token ON email_subscribers (verification_token);
