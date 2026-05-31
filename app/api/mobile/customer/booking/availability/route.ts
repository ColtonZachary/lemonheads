import { getDetailerAvailability } from "@/app/actions/booking-availability";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import {
  buildLocationSchedulingContext,
  fetchServiceAreaTravelMap,
} from "@/lib/bookings/location-scheduling";
import { listTimeSlotStates } from "@/lib/bookings/scheduling-limits";
import {
  fetchActiveCoverageRules,
} from "@/lib/bookings/service-area-coverage";
import {
  fetchSchedulingRules,
  resolveServiceAreaSlugsForLocation,
} from "@/lib/bookings/scheduling-rules";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateLabel = searchParams.get("dateLabel")?.trim() ?? "";
  const durationHours = Number.parseFloat(searchParams.get("durationHours") ?? "2");
  const packageKey = searchParams.get("packageKey")?.trim() ?? "";
  const location = searchParams.get("location")?.trim() ?? "";
  const zip = searchParams.get("zip")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";

  if (!dateLabel) {
    return Response.json({ error: "dateLabel is required" }, { status: 400 });
  }

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

    const slotStates = listTimeSlotStates(
      dateLabel,
      schedulingRules,
      serviceAreaSlugs,
      locationContext,
    );

    const availability = await getDetailerAvailability(
      dateLabel,
      Number.isFinite(durationHours) && durationHours > 0 ? durationHours : 2,
      packageKey || undefined,
      serviceAreaSlugs,
    );

    return Response.json({
      timeSlots: BOOKING_TIME_SLOTS,
      slotStates,
      fullyBookedSlots: availability.fullyBookedSlots,
      busySlotsByDetailer: availability.busySlotsByDetailer,
    });
  } catch (err) {
    console.error("[mobile customer booking availability]", err);
    return Response.json({ error: "Could not load availability" }, { status: 500 });
  }
}
