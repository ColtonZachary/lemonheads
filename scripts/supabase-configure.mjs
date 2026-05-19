#!/usr/bin/env node
/**
 * Writes Supabase URL + publishable key into .env.local
 *
 * Usage:
 *   node scripts/supabase-configure.mjs sb_publishable_xxxx
 *   npm run supabase:configure -- sb_publishable_xxxx
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_URL = "https://bgphebaffmdxvtrhyhxf.supabase.co";
const key = process.argv[2]?.trim();

if (!key || !key.startsWith("sb_publishable_")) {
  console.error(
    "Usage: npm run supabase:configure -- sb_publishable_YOUR_KEY_HERE",
  );
  console.error(
    "Copy the full publishable key from Supabase → Settings → API Keys.",
  );
  process.exit(1);
}

const envPath = resolve(process.cwd(), ".env.local");
let body = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

const set = (name, value) => {
  const line = `${name}=${value}`;
  const re = new RegExp(`^${name}=.*$`, "m");
  body = re.test(body) ? body.replace(re, line) : `${body.trimEnd()}\n${line}\n`;
};

set("NEXT_PUBLIC_SUPABASE_URL", PROJECT_URL);
set("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
set("NEXT_PUBLIC_SUPABASE_ANON_KEY", key);

writeFileSync(envPath, body.endsWith("\n") ? body : `${body}\n`);
console.log("Updated .env.local with Supabase URL and publishable key.");
console.log("Restart the dev server: npm run dev");
