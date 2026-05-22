import type { SupabaseClient } from "@supabase/supabase-js";

/** Detailer display name → allowed service_area slugs; empty/missing = all areas. */
export type DetailerServiceAreasMap = Record<string, string[]>;

export function hasDetailerServiceAreaRestrictions(
  map: DetailerServiceAreasMap,
  detailerName: string,
): boolean {
  return (map[detailerName]?.length ?? 0) > 0;
}

export function isDetailerAllowedInServiceAreas(
  map: DetailerServiceAreasMap,
  detailerName: string,
  serviceAreaSlugs: string[],
): boolean {
  const allowed = map[detailerName];
  if (!allowed?.length) return true;
  if (!serviceAreaSlugs.length) return true;
  return serviceAreaSlugs.some((slug) => allowed.includes(slug));
}

export function filterDetailersForServiceAreas(
  detailerNames: readonly string[],
  serviceAreaSlugs: string[],
  map: DetailerServiceAreasMap,
): string[] {
  if (!serviceAreaSlugs.length) return [...detailerNames];
  return detailerNames.filter((name) =>
    isDetailerAllowedInServiceAreas(map, name, serviceAreaSlugs),
  );
}

export async function fetchDetailerServiceAreasMap(
  client: SupabaseClient,
): Promise<DetailerServiceAreasMap> {
  const [{ data: rows, error: rowsError }, { data: staff, error: staffError }] =
    await Promise.all([
      client
        .from("staff_service_areas")
        .select("staff_member_id, service_area_slug"),
      client.from("staff_members").select("id, display_name"),
    ]);

  if (rowsError) {
    console.error("[staff] service areas:", rowsError.message);
    return {};
  }
  if (staffError) {
    console.error("[staff] service areas staff:", staffError.message);
    return {};
  }

  const idToName = new Map(
    (staff ?? []).map((row) => [row.id as string, row.display_name as string]),
  );

  const map: DetailerServiceAreasMap = {};
  for (const row of rows ?? []) {
    const name = idToName.get(row.staff_member_id as string);
    if (!name) continue;
    const list = map[name] ?? [];
    list.push(row.service_area_slug as string);
    map[name] = list;
  }
  return map;
}

export async function fetchAllowedServiceAreaSlugsForStaff(
  client: SupabaseClient,
  staffMemberId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("staff_service_areas")
    .select("service_area_slug")
    .eq("staff_member_id", staffMemberId);

  if (error) {
    console.error("[staff] service areas for member:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.service_area_slug as string);
}

export async function syncStaffServiceAreas(
  client: SupabaseClient,
  staffMemberId: string,
  areaSlugs: string[],
  allowedSlugs: ReadonlySet<string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = [
    ...new Set(
      areaSlugs.map((s) => s.trim()).filter((s) => s && allowedSlugs.has(s)),
    ),
  ];

  const { error: deleteError } = await client
    .from("staff_service_areas")
    .delete()
    .eq("staff_member_id", staffMemberId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  if (!normalized.length) return { ok: true };

  const { error: insertError } = await client.from("staff_service_areas").insert(
    normalized.map((service_area_slug) => ({
      staff_member_id: staffMemberId,
      service_area_slug,
    })),
  );

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return { ok: true };
}
