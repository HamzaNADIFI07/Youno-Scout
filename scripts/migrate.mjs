#!/usr/bin/env node
// Runner de migrations Neon : exécute les fichiers SQL non encore appliqués.
// Usage : node --env-file=.env.local scripts/migrate.mjs
//   (utilisé via `npm run migrate`)

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error("✗ NEON_DATABASE_URL manquant dans .env.local");
  process.exit(1);
}

const sql = neon(url);
const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations");

// Table de suivi
await sql`
  CREATE TABLE IF NOT EXISTS _migrations (
    name VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const appliedRows = await sql`SELECT name FROM _migrations`;
const applied = new Set(appliedRows.map((r) => r.name));

const files = (await readdir(migrationsDir))
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("Aucun fichier .sql trouvé dans migrations/");
  process.exit(0);
}

let appliedCount = 0;
let skippedCount = 0;

for (const file of files) {
  if (applied.has(file)) {
    console.log(`· ${file} (déjà appliqué)`);
    skippedCount++;
    continue;
  }

  const content = await readFile(join(migrationsDir, file), "utf8");
  // Retire les lignes de commentaire `--` puis split sur `;` en fin de statement.
  // Les fichiers ne contiennent pas de chaînes avec `;` ni de fonctions PL/pgSQL,
  // donc le split naïf est suffisant.
  const sanitized = content
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = sanitized
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`→ ${file} (${statements.length} statement${statements.length > 1 ? "s" : ""})`);
  for (const stmt of statements) {
    await sql.query(stmt);
  }
  await sql`INSERT INTO _migrations (name) VALUES (${file})`;
  appliedCount++;
  console.log(`✓ ${file} appliqué`);
}

console.log("");
console.log(`Terminé. ${appliedCount} appliqué(s), ${skippedCount} déjà appliqué(s).`);
