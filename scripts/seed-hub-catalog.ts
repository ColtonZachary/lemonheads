#!/usr/bin/env npx tsx
/**
 * Seeds catalog + staff from lib/data.ts into Supabase.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

import { ADDONS, LOCATIONS, PACKAGES, TEAM } from "../lib/data";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env.local */
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const LOCATION_TYPES = [
  "Come to my home",
  "Come to my office / workplace",
  "Drop off at your Edmond location",
];

async function main() {
  for (const loc of LOCATIONS) {
    const slug = loc.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { error } = await supabase.from("service_areas").upsert({
      slug,
      city: loc.city,
      state: loc.state,
      marketing_url: loc.url,
      active: true,
      sort_order: 0,
    });
    if (error) console.warn("service_areas", slug, error.message);
  }

  const defaultCoverage: Record<string, { zips: string[]; cities: string[] }> = {
    "oklahoma-city": { zips: ["731", "730"], cities: ["Oklahoma City"] },
    tulsa: { zips: ["741"], cities: ["Tulsa"] },
    enid: { zips: ["737"], cities: ["Enid"] },
  };

  for (const loc of LOCATIONS) {
    const slug = loc.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const rules = defaultCoverage[slug];
    if (!rules) continue;

    for (const zip_prefix of rules.zips) {
      const { error } = await supabase.from("service_area_coverage").insert({
        service_area_slug: slug,
        zip_prefix,
        city_name: null,
        active: true,
      });
      if (error && error.code !== "23505") {
        console.warn("service_area_coverage zip", slug, zip_prefix, error.message);
      }
    }
    for (const city_name of rules.cities) {
      const { error } = await supabase.from("service_area_coverage").insert({
        service_area_slug: slug,
        zip_prefix: null,
        city_name,
        active: true,
      });
      if (error && error.code !== "23505") {
        console.warn("service_area_coverage city", slug, city_name, error.message);
      }
    }
  }

  for (let i = 0; i < LOCATION_TYPES.length; i++) {
    const { error } = await supabase.from("booking_location_types").upsert(
      { label: LOCATION_TYPES[i], active: true, sort_order: i },
      { onConflict: "label" },
    );
    if (error) console.warn("booking_location_types", error.message);
  }

  for (let i = 0; i < PACKAGES.length; i++) {
    const p = PACKAGES[i];
    await supabase.from("catalog_packages").upsert({
      key: p.key,
      name: p.name,
      description: p.description,
      features: p.features,
      duration_hours: p.durationHours,
      featured: Boolean(p.featured),
      active: true,
      sort_order: i,
    });
    for (const [vehicleKey, price] of Object.entries(p.prices)) {
      await supabase.from("catalog_package_prices").upsert({
        package_key: p.key,
        vehicle_key: vehicleKey,
        price_cents: Math.round(price * 100),
      });
    }
  }

  for (let i = 0; i < ADDONS.length; i++) {
    const a = ADDONS[i];
    const { error } = await supabase.from("catalog_addons").upsert(
      {
        name: a.name,
        description: a.description,
        price_cents: Math.round(a.price * 100),
        price_suffix: a.priceSuffix ?? "",
        icon: a.icon,
        active: true,
        sort_order: i,
      },
      { onConflict: "name" },
    );
    if (error) console.warn("catalog_addons", a.name, error.message);
  }

  for (let i = 0; i < TEAM.length; i++) {
    const m = TEAM[i];
    const slug = m.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const { error } = await supabase.from("staff_members").upsert(
      {
        slug,
        display_name: m.name,
        role_label: m.role,
        bio: m.bio,
        is_detailer: m.isDetailer,
        is_bookable: m.isDetailer,
        sort_order: i,
        active: true,
      },
      { onConflict: "slug" },
    );
    if (error) console.warn("staff_members", slug, error.message);

    if (m.photo) {
      const storagePath = m.photo.replace(/^\//, "");
      await supabase.from("site_images").upsert(
        {
          category: "team",
          storage_path: storagePath,
          alt_text: m.name,
          member_slug: slug,
          sort_order: i,
          published: true,
        },
        { onConflict: "category,storage_path" },
      );
    }
  }

  console.log(
    "[hub:seed] Done — service areas, coverage rules, packages, add-ons, staff, location types.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
