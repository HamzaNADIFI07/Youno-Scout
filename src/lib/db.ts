import { neon } from "@neondatabase/serverless";

let cachedClient: ReturnType<typeof neon> | null = null;

export class DbConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DbConfigError";
  }
}

export function getDbClient() {
  if (cachedClient) return cachedClient;
  const url = process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new DbConfigError(
      "NEON_DATABASE_URL manquant. Configurez-le dans .env.local."
    );
  }
  cachedClient = neon(url);
  return cachedClient;
}
