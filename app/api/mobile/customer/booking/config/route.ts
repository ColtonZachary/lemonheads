import { fetchBookableDetailersWithPhotos } from "@/lib/bookings/bookable-detailers";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import { fetchSchedulingRules } from "@/lib/bookings/scheduling-rules";
import { VEHICLE_OPTIONS } from "@/lib/data";
import { fetchPublicCatalog } from "@/lib/catalog/public-catalog";
import { createPublicReadClient } from "@/lib/supabase/public-read";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const readClient = createPublicReadClient();
  const admin = getSupabaseAdmin();

  if (!readClient) {
    return Response.json({ error: "Catalog is not configured" }, { status: 503 });
  }

  try {
    const [catalog, schedulingRules, detailers] = await Promise.all([
      fetchPublicCatalog(readClient, { includeLocations: true }),
      fetchSchedulingRules(admin),
      admin
        ? fetchBookableDetailersWithPhotos(admin)
        : Promise.resolve([]),
    ]);

    return Response.json({
      catalog,
      vehicles: VEHICLE_OPTIONS,
      timeSlots: BOOKING_TIME_SLOTS,
      schedulingRules,
      detailers,
    });
  } catch (err) {
    console.error("[mobile customer booking config]", err);
    return Response.json({ error: "Could not load booking config" }, { status: 500 });
  }
}
