import {
  buildLocationSchedulingContext,
  fetchServiceAreaTravelMap,
} from "@/lib/bookings/location-scheduling";
import { listBookableDateLabels } from "@/lib/bookings/scheduling-limits";
import { fetchActiveCoverageRules } from "@/lib/bookings/service-area-coverage";
import {
  fetchSchedulingRules,
  resolveServiceAreaSlugsForLocation,
} from "@/lib/bookings/scheduling-rules";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location")?.trim() ?? "";
  const zip = searchParams.get("zip")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";

  const admin = getSupabaseAdmin();
  if (!admin) {
    return Response.json({ error: "Booking system is unavailable" }, { status: 503 });
  }

  try {
    const [schedulingRules, coverageRules, travelBySlug] = await Promise.all([
      fetchSchedulingRules(admin),
      fetchActiveCoverageRules(admin),
      fetchServiceAreaTravelMap(admin),
    ]);

    const serviceAreaSlugs = resolveServiceAreaSlugsForLocation(
      zip,
      city,
      coverageRules,
    );
    const locationContext = buildLocationSchedulingContext(
      location,
      zip,
      city,
      coverageRules,
      travelBySlug,
    );

    const dates = listBookableDateLabels(
      schedulingRules,
      serviceAreaSlugs,
      locationContext,
    );

    return Response.json({ dates });
  } catch (err) {
    console.error("[mobile customer booking dates]", err);
    return Response.json({ error: "Could not load dates" }, { status: 500 });
  }
}
