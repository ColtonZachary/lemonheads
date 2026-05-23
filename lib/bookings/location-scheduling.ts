import type { SupabaseClient } from "@supabase/supabase-js";

import { BUSINESS_TIME_ZONE } from "@/lib/bookings/parse-schedule";
import { resolveServiceAreaSlugsForLocation } from "@/lib/bookings/scheduling-rules";
import {
  DROP_OFF_LOCATION_TYPE,
  normalizeCity,
  type ServiceAreaCoverageRule,
} from "@/lib/bookings/service-area-coverage";

/** Slots before this time are blocked for Enid and 60+ min locations. */
export const LOCATION_EARLIEST_SLOT = "8:30 AM";

export const FAR_TRAVEL_MINUTES_THRESHOLD = 60;

export const ENID_SERVICE_AREA_SLUG = "enid";

function centralTodayDateInput(): string {
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

export type ServiceAreaTravelMap = Record<string, number>;

/** Used when the travel_minutes_from_shop column is not migrated yet. */
export const DEFAULT_SERVICE_AREA_TRAVEL: ServiceAreaTravelMap = {
  "oklahoma-city": 35,
  tulsa: 90,
  enid: 75,
};

export type LocationSchedulingContext = {
  /** Edmond drop-off — no travel-based slot rules. */
  skipTravelRules: boolean;
  travelMinutesFromShop: number | null;
  isEnid: boolean;
  /** Block 8:00 AM (Enid always; 60+ min from shop). */
  earliestSlot830: boolean;
  /** 60+ min from shop — earliest bookable appointment is tomorrow. */
  nextDayOnly: boolean;
};

export async function fetchServiceAreaTravelMap(
  client: SupabaseClient | null,
): Promise<ServiceAreaTravelMap> {
  if (!client) return { ...DEFAULT_SERVICE_AREA_TRAVEL };

  const { data, error } = await client
    .from("service_areas")
    .select("slug, travel_minutes_from_shop")
    .eq("active", true);

  if (error) {
    const missingColumn = error.message.includes("travel_minutes_from_shop");
    if (missingColumn) {
      const { data: slugRows } = await client
        .from("service_areas")
        .select("slug")
        .eq("active", true);
      const map: ServiceAreaTravelMap = { ...DEFAULT_SERVICE_AREA_TRAVEL };
      for (const row of slugRows ?? []) {
        const slug = row.slug as string;
        if (!(slug in map)) map[slug] = 0;
      }
      return map;
    }
    console.error("[location-scheduling] fetch travel:", error.message);
    return { ...DEFAULT_SERVICE_AREA_TRAVEL };
  }

  const map: ServiceAreaTravelMap = { ...DEFAULT_SERVICE_AREA_TRAVEL };
  for (const row of data ?? []) {
    const slug = row.slug as string;
    const minutes = row.travel_minutes_from_shop as number;
    if (typeof minutes === "number" && minutes >= 0) {
      map[slug] = minutes;
    }
  }
  return map;
}

export function resolveTravelMinutesFromShop(
  zip: string,
  city: string,
  coverageRules: ServiceAreaCoverageRule[],
  travelBySlug: ServiceAreaTravelMap,
): number | null {
  const slugs = resolveServiceAreaSlugsForLocation(zip, city, coverageRules);
  if (!slugs.length) return null;

  let max = 0;
  for (const slug of slugs) {
    const minutes = travelBySlug[slug];
    if (typeof minutes === "number" && minutes > max) max = minutes;
  }
  return max;
}

export function buildLocationSchedulingContext(
  locationType: string,
  zip: string,
  city: string,
  coverageRules: ServiceAreaCoverageRule[],
  travelBySlug: ServiceAreaTravelMap,
): LocationSchedulingContext {
  const trimmedType = locationType.trim();
  const skipTravelRules =
    Boolean(trimmedType) && trimmedType === DROP_OFF_LOCATION_TYPE;

  if (skipTravelRules) {
    return {
      skipTravelRules: true,
      travelMinutesFromShop: null,
      isEnid: false,
      earliestSlot830: false,
      nextDayOnly: false,
    };
  }

  const slugs = resolveServiceAreaSlugsForLocation(zip, city, coverageRules);
  const isEnid =
    slugs.includes(ENID_SERVICE_AREA_SLUG) || normalizeCity(city) === "enid";
  const travelMinutes = resolveTravelMinutesFromShop(
    zip,
    city,
    coverageRules,
    travelBySlug,
  );
  const farTravel =
    travelMinutes !== null &&
    travelMinutes >= FAR_TRAVEL_MINUTES_THRESHOLD;

  return {
    skipTravelRules: false,
    travelMinutesFromShop: travelMinutes,
    isEnid,
    earliestSlot830: isEnid || farTravel,
    nextDayOnly: farTravel,
  };
}

export function locationSchedulingApplies(
  locationContext?: LocationSchedulingContext | null,
): boolean {
  return Boolean(locationContext && !locationContext.skipTravelRules);
}

export function isDateAllowedForLocation(
  dateInput: string,
  locationContext?: LocationSchedulingContext | null,
): boolean {
  if (!locationSchedulingApplies(locationContext)) return true;
  if (locationContext!.nextDayOnly && dateInput === centralTodayDateInput()) {
    return false;
  }
  return true;
}

export function isTimeSlotAllowedForLocation(
  timeSlot: string,
  locationContext?: LocationSchedulingContext | null,
): boolean {
  if (!locationSchedulingApplies(locationContext)) return true;
  if (locationContext!.earliestSlot830 && timeSlot === "8:00 AM") return false;
  return true;
}

export function locationSchedulingHint(
  locationContext?: LocationSchedulingContext | null,
): string | null {
  if (!locationSchedulingApplies(locationContext)) return null;

  const parts: string[] = [];
  if (locationContext!.isEnid) {
    parts.push("Enid bookings start at 8:30 AM.");
  } else if (locationContext!.earliestSlot830) {
    parts.push("Earliest available time is 8:30 AM.");
  }
  if (locationContext!.nextDayOnly) {
    const tomorrow = addDaysToDateInput(centralTodayDateInput(), 1);
    parts.push(
      `Locations 60+ minutes from our Edmond shop require booking the next day or later (earliest ${tomorrow}).`,
    );
  }
  return parts.length ? parts.join(" ") : null;
}

export function validateLocationScheduleFromInput(
  dateInput: string,
  timeSlot: string,
  locationContext?: LocationSchedulingContext | null,
): string | null {
  if (!locationSchedulingApplies(locationContext)) return null;

  if (!isDateAllowedForLocation(dateInput, locationContext)) {
    return "This location requires booking at least the next day. Please pick a future date.";
  }
  if (!isTimeSlotAllowedForLocation(timeSlot, locationContext)) {
    if (locationContext!.isEnid) {
      return "Enid bookings start at 8:30 AM. Please pick a later time.";
    }
    return "Earliest available time for this location is 8:30 AM.";
  }
  return null;
}
