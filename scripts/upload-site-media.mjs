#!/usr/bin/env node
/**
 * Uploads /public photos to Supabase Storage and seeds site_images.
 * Requires SUPABASE_SERVICE_ROLE_KEY (secret key) in .env.local
 *
 *   npm run supabase:upload
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  console.error(
    "Add your secret key from Supabase → Settings → API Keys (sb_secret_…).",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const BUCKET = "site-media";
const publicDir = resolve(process.cwd(), "public");

const uploads = [
  {
    local: "gallery/gallery-4.webp",
    storage: "gallery/gallery-4.webp",
    category: "gallery",
    alt: "Showroom finish on a silver vehicle under studio lighting",
    layout: "lg:col-span-7 lg:row-span-1 lg:h-[380px] h-[260px]",
    slug: null,
    sort: 0,
  },
  {
    local: "gallery/gallery-6.webp",
    storage: "gallery/gallery-6.webp",
    category: "gallery",
    alt: "Machine polishing black paint to a mirror finish",
    layout: "lg:col-span-5 lg:row-span-1 lg:h-[380px] h-[260px]",
    slug: null,
    sort: 1,
  },
  {
    local: "gallery/gallery-2.webp",
    storage: "gallery/gallery-2.webp",
    category: "gallery",
    alt: "Headlight restoration with microfiber detailing",
    layout: "lg:col-span-4 lg:h-[260px] h-[200px]",
    slug: null,
    sort: 2,
  },
  {
    local: "gallery/gallery-3.webp",
    storage: "gallery/gallery-3.webp",
    category: "gallery",
    alt: "Interior door panel deep clean with professional brushes",
    layout: "lg:col-span-4 lg:h-[260px] h-[200px]",
    slug: null,
    sort: 3,
  },
  {
    local: "gallery/gallery-1.webp",
    storage: "gallery/gallery-1.webp",
    category: "gallery",
    alt: "Infotainment screen and dash interior detailing",
    layout: "lg:col-span-4 lg:h-[260px] h-[200px]",
    slug: null,
    sort: 4,
  },
  { local: "team/colton.webp", storage: "team/colton.webp", category: "team", alt: "Colton", layout: null, slug: "colton", sort: 0 },
  { local: "team/dave.webp", storage: "team/dave.webp", category: "team", alt: "Dave", layout: null, slug: "dave", sort: 0 },
  { local: "team/gunner.jpg", storage: "team/gunner.jpg", category: "team", alt: "Gunner", layout: null, slug: "gunner", sort: 0 },
  { local: "team/owen.webp", storage: "team/owen.webp", category: "team", alt: "Owen", layout: null, slug: "owen", sort: 0 },
  { local: "team/austin.webp", storage: "team/austin.webp", category: "team", alt: "Austin", layout: null, slug: "austin", sort: 0 },
  { local: "team/richard.jpg", storage: "team/richard.jpg", category: "team", alt: "Richard", layout: null, slug: "richard", sort: 0 },
];

function contentType(file) {
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

async function main() {
  console.log("Uploading site media to Supabase…\n");

  for (const item of uploads) {
    const filePath = join(publicDir, item.local);
    if (!existsSync(filePath)) {
      console.warn(`  skip (missing): ${item.local}`);
      continue;
    }
    const body = readFileSync(filePath);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(item.storage, body, { upsert: true, contentType: contentType(item.local) });

    if (error) {
      console.error(`  failed ${item.storage}:`, error.message);
      process.exitCode = 1;
      continue;
    }
    console.log(`  uploaded ${item.storage}`);

    const row = {
      category: item.category,
      storage_path: item.storage,
      alt_text: item.alt,
      layout_class: item.layout,
      member_slug: item.slug,
      sort_order: item.sort,
      published: true,
    };

    const { error: dbError } = await supabase.from("site_images").upsert(row, {
      onConflict: "category,storage_path",
    });

    if (dbError) {
      console.error(`  site_images ${item.storage}:`, dbError.message);
      console.error(
        "    → Run supabase/migrations/20260519000000_site_media.sql in the SQL Editor first.",
      );
      process.exitCode = 1;
    }
  }

  console.log("\nDone. Restart `npm run dev` if it is already running.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
