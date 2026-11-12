/**
 * Applies SQL files in supabase/migrations/ in sorted order.
 * Requires SUPABASE_DB_URL (or DATABASE_URL): Postgres URI from
 * Supabase Dashboard → Project Settings → Database → Connection string → URI
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.dirname(fileURLToPath(import.meta.url));
const envLocal = path.join(root, "..", ".env.local");
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const connectionString = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "Missing SUPABASE_DB_URL. Add your Postgres connection URI to .env.local, then run:\n" +
      "  npx dotenv -e .env.local -- npm run db:migrate\n" +
      "Or paste supabase/migrations/*.sql in the Supabase SQL editor (see docs/DEPLOY.md).",
  );
  process.exit(1);
}

const migDir = path.join(root, "..", "supabase", "migrations");
const files = fs.readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migDir, file), "utf8");
    console.log(`Applying ${file}...`);
    await client.query(sql);
    console.log(`  OK`);
  }
  console.log("All migrations applied.");
} catch (err) {
  console.error("Migration failed:", err.message ?? err);
  process.exit(1);
} finally {
  await client.end();
}
