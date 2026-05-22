import type { SupabaseClient } from "@supabase/supabase-js";

/** Detailer display name → package keys blocked on the public booking flow. */
export type DetailerPackageBlocksMap = Record<string, string[]>;

export function isDetailerBlockedForPackage(
  blocks: DetailerPackageBlocksMap,
  detailerName: string,
  packageKey: string,
): boolean {
  const key = packageKey.trim();
  if (!key) return false;
  const blocked = blocks[detailerName];
  return Boolean(blocked?.includes(key));
}

export function filterDetailersForPackage(
  detailerNames: readonly string[],
  packageKey: string,
  blocks: DetailerPackageBlocksMap,
): string[] {
  const key = packageKey.trim();
  if (!key) return [...detailerNames];
  return detailerNames.filter((name) => !isDetailerBlockedForPackage(blocks, name, key));
}

export async function fetchDetailerPackageBlocksMap(
  client: SupabaseClient,
): Promise<DetailerPackageBlocksMap> {
  const [{ data: blocks, error: blocksError }, { data: staff, error: staffError }] =
    await Promise.all([
      client.from("staff_package_blocks").select("staff_member_id, package_key"),
      client.from("staff_members").select("id, display_name"),
    ]);

  if (blocksError) {
    console.error("[staff] package blocks:", blocksError.message);
    return {};
  }
  if (staffError) {
    console.error("[staff] package blocks staff:", staffError.message);
    return {};
  }

  const idToName = new Map(
    (staff ?? []).map((row) => [row.id as string, row.display_name as string]),
  );

  const map: DetailerPackageBlocksMap = {};
  for (const row of blocks ?? []) {
    const name = idToName.get(row.staff_member_id as string);
    if (!name) continue;
    const list = map[name] ?? [];
    list.push(row.package_key as string);
    map[name] = list;
  }
  return map;
}

export async function fetchBlockedPackageKeysForStaff(
  client: SupabaseClient,
  staffMemberId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("staff_package_blocks")
    .select("package_key")
    .eq("staff_member_id", staffMemberId);

  if (error) {
    console.error("[staff] package blocks for member:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.package_key as string);
}

export async function syncStaffPackageBlocks(
  client: SupabaseClient,
  staffMemberId: string,
  packageKeys: string[],
  allowedKeys: ReadonlySet<string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = [
    ...new Set(
      packageKeys.map((k) => k.trim()).filter((k) => k && allowedKeys.has(k)),
    ),
  ];

  const { error: deleteError } = await client
    .from("staff_package_blocks")
    .delete()
    .eq("staff_member_id", staffMemberId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  if (!normalized.length) return { ok: true };

  const { error: insertError } = await client.from("staff_package_blocks").insert(
    normalized.map((package_key) => ({
      staff_member_id: staffMemberId,
      package_key,
    })),
  );

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return { ok: true };
}
