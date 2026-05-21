import type { SupabaseClient } from "@supabase/supabase-js";

import { BOOKING_LOCATION_TYPES } from "@/lib/bookings/constants";

/** Shown to customers when ZIP/city is outside configured service areas. */
export const OUT_OF_COVERAGE_CUSTOMER_MESSAGE =
  "We do not cover your location please call us to see if we can make an exception";

export const DROP_OFF_LOCATION_TYPE = BOOKING_LOCATION_TYPES[2];

export type ServiceAreaCoverageRule = {
  id: string;
  service_area_slug: string;
  zip_prefix: string | null;
  city_name: string | null;
  active: boolean;
};

export function locationRequiresCoverageCheck(location: string): boolean {
  const trimmed = location.trim();
  if (!trimmed) return true;
  return trimmed !== DROP_OFF_LOCATION_TYPE;
}

/** Digits only, up to 5 (US ZIP or ZIP+4 prefix). */
export function normalizeZip(zip: string): string {
  return zip.replace(/\D/g, "").slice(0, 5);
}

export function normalizeCity(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

export function isLocationInServiceArea(
  zip: string,
  city: string,
  rules: ServiceAreaCoverageRule[],
): boolean {
  const active = rules.filter((r) => r.active);
  if (!active.length) return true;

  const zipNorm = normalizeZip(zip);
  const cityNorm = normalizeCity(city);

  for (const rule of active) {
    if (rule.zip_prefix) {
      const prefix = rule.zip_prefix.replace(/\D/g, "");
      if (prefix.length > 0 && zipNorm.length >= prefix.length && zipNorm.startsWith(prefix)) {
        return true;
      }
    }
    if (rule.city_name) {
      const ruleCity = normalizeCity(rule.city_name);
      if (ruleCity && cityNorm === ruleCity) return true;
    }
  }

  return false;
}

export type CoverageValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateBookingLocationCoverage(
  location: string,
  zip: string,
  city: string,
  rules: ServiceAreaCoverageRule[],
  options?: { customerFacing?: boolean },
): CoverageValidationResult {
  if (!locationRequiresCoverageCheck(location)) {
    return { ok: true };
  }

  const zipNorm = normalizeZip(zip);
  const cityNorm = normalizeCity(city);

  if (!zipNorm && !cityNorm) {
    return {
      ok: false,
      message: options?.customerFacing
        ? "Please enter your city and ZIP code."
        : "City or ZIP is required for mobile service locations.",
    };
  }

  if (isLocationInServiceArea(zip, city, rules)) {
    return { ok: true };
  }

  return {
    ok: false,
    message: options?.customerFacing
      ? OUT_OF_COVERAGE_CUSTOMER_MESSAGE
      : `Not in service area. ${OUT_OF_COVERAGE_CUSTOMER_MESSAGE}`,
  };
}

export async function fetchActiveCoverageRules(
  client: SupabaseClient,
): Promise<ServiceAreaCoverageRule[]> {
  const { data, error } = await client
    .from("service_area_coverage")
    .select("id, service_area_slug, zip_prefix, city_name, active")
    .eq("active", true);

  if (error) {
    console.error("[coverage] fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as ServiceAreaCoverageRule[];
}
