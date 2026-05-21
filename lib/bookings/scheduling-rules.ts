import type { SupabaseClient } from "@supabase/supabase-js";

import { BUSINESS_TIME_ZONE } from "@/lib/bookings/parse-schedule";
import {
  type ServiceAreaCoverageRule,
  normalizeCity,
  normalizeZip,
} from "@/lib/bookings/service-area-coverage";

export type AreaBlackout = {
  date: string;
  serviceAreaSlug: string;
};

/** Serializable rules for public /book and server validation. */
export type SchedulingRulesSnapshot = {
  sameDayCutoffHour: number;
  sameDayCutoffEnabled: boolean;
  globalBlackoutDates: string[];
  areaBlackouts: AreaBlackout[];
};

function getCentralTodayDateInput(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDaysToDateInput(dateInput: string, deltaDays: number): string {
  const probe = new Date(`${dateInput}T12:00:00`);
  probe.setDate(probe.getDate() + deltaDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(probe);
}

const DEFAULT_RULES: SchedulingRulesSnapshot = {
  sameDayCutoffHour: 16,
  sameDayCutoffEnabled: true,
  globalBlackoutDates: [],
  areaBlackouts: [],
};

export async function fetchSchedulingRules(
  client: SupabaseClient | null,
): Promise<SchedulingRulesSnapshot> {
  if (!client) return DEFAULT_RULES;

  const today = getCentralTodayDateInput();
  const horizon = addDaysToDateInput(today, 400);

  const [{ data: cutoffRule }, { data: blackouts }] = await Promise.all([
    client
      .from("lead_time_rules")
      .select("active, config")
      .eq("rule_key", "same_day_cutoff")
      .maybeSingle(),
    client
      .from("blackout_dates")
      .select("blackout_date, service_area_slug")
      .gte("blackout_date", today)
      .lte("blackout_date", horizon),
  ]);

  const config = cutoffRule?.config as { cutoff_hour?: number } | undefined;
  const cutoffHour =
    typeof config?.cutoff_hour === "number" &&
    config.cutoff_hour >= 0 &&
    config.cutoff_hour <= 23
      ? config.cutoff_hour
      : DEFAULT_RULES.sameDayCutoffHour;

  const globalBlackoutDates: string[] = [];
  const areaBlackouts: AreaBlackout[] = [];

  for (const row of blackouts ?? []) {
    const date = row.blackout_date as string;
    const slug = row.service_area_slug as string | null;
    if (slug) {
      areaBlackouts.push({ date, serviceAreaSlug: slug });
    } else {
      globalBlackoutDates.push(date);
    }
  }

  return {
    sameDayCutoffHour: cutoffHour,
    sameDayCutoffEnabled: cutoffRule?.active !== false,
    globalBlackoutDates,
    areaBlackouts,
  };
}

export function resolveServiceAreaSlugsForLocation(
  zip: string,
  city: string,
  coverageRules: ServiceAreaCoverageRule[],
): string[] {
  const zipNorm = normalizeZip(zip);
  const cityNorm = normalizeCity(city);
  const slugs = new Set<string>();

  for (const rule of coverageRules.filter((r) => r.active)) {
    let match = false;
    if (rule.zip_prefix && zipNorm) {
      const prefix = rule.zip_prefix.replace(/\D/g, "");
      if (prefix.length > 0 && zipNorm.startsWith(prefix)) match = true;
    }
    if (rule.city_name && cityNorm === normalizeCity(rule.city_name)) {
      match = true;
    }
    if (match) slugs.add(rule.service_area_slug);
  }

  return [...slugs];
}

export function isDateInputBlackout(
  dateInput: string,
  rules: SchedulingRulesSnapshot,
  serviceAreaSlugs: string[] = [],
): boolean {
  if (rules.globalBlackoutDates.includes(dateInput)) return true;
  if (!serviceAreaSlugs.length) return false;
  return rules.areaBlackouts.some(
    (b) =>
      b.date === dateInput && serviceAreaSlugs.includes(b.serviceAreaSlug),
  );
}
