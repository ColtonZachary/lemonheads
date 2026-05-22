import type { SupabaseClient } from "@supabase/supabase-js";

/** Default package pay in cents (Regular / Senior). */
export const DEFAULT_PACKAGE_PAY_RATES: Record<
  string,
  { regular: number; senior: number }
> = {
  boujee: { regular: 7500, senior: 8000 },
  fully: { regular: 6000, senior: 6500 },
  interior: { regular: 4500, senior: 5000 },
  toughy: { regular: 4000, senior: 4500 },
  basic: { regular: 4000, senior: 4500 },
  quickie: { regular: 2000, senior: 2500 },
};

/** Default add-on pay in cents — keyed by normalized name. */
export const DEFAULT_ADDON_PAY_RATES: Record<
  string,
  { regular: number; senior: number }
> = {
  "headlight restoration": { regular: 3000, senior: 3000 },
  "minor scratch removal": { regular: 3000, senior: 3000 },
  "engine bay cleaning": { regular: 2500, senior: 2500 },
  "clay bar": { regular: 1650, senior: 1650 },
  "ceramic spray": { regular: 1500, senior: 1500 },
  "steam clean": { regular: 1000, senior: 1000 },
  "pet hair removal": { regular: 1650, senior: 1650 },
  "additional time": { regular: 2500, senior: 2500 },
};

/** Map catalog add-on labels to pay-sheet keys. */
const ADDON_PAY_ALIASES: Record<string, string> = {
  "headlight restoration": "headlight restoration",
  "engine bay clean": "engine bay cleaning",
  "engine bay cleaning": "engine bay cleaning",
  "additional cleaning": "additional time",
  "pet hair removal": "pet hair removal",
  "clay bar": "clay bar",
  "ceramic spray": "ceramic spray",
  "steam clean": "steam clean",
  "minor scratch removal": "minor scratch removal",
  "shampoo": "shampoo",
  "ozone air treatment": "ozone air treatment",
  "child seat clean": "child seat clean",
};

export type DetailerPayRatesSnapshot = {
  packages: Map<string, { regular: number; senior: number }>;
  addons: Map<string, { regular: number; senior: number }>;
};

export function normalizeAddonPayKey(name: string): string {
  const trimmed = name.trim().toLowerCase();
  return ADDON_PAY_ALIASES[trimmed] ?? trimmed;
}

export function dollarsToPayCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatPayDollarsInput(cents: number): string {
  if (cents <= 0) return "";
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
}

export function parsePayDollarsInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/[$,\s]/g, "");
  if (!trimmed) return null;
  const amount = Number.parseFloat(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

/** Safe suffix for HTML field names derived from addon pay keys. */
export function addonPayFieldId(addonKey: string): string {
  return addonKey.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
}

export type PackagePayRateEditorRow = {
  packageKey: string;
  packageName: string;
  regularCents: number;
  seniorCents: number;
};

export type AddonPayRateEditorRow = {
  addonKey: string;
  displayLabel: string;
  regularCents: number;
  seniorCents: number;
  fieldId: string;
};

export async function fetchPayRatesForEditor(
  client: SupabaseClient,
): Promise<{
  packages: PackagePayRateEditorRow[];
  addons: AddonPayRateEditorRow[];
}> {
  const rates = await fetchDetailerPayRates(client);

  const [{ data: catalogPkgs }, { data: catalogAddons }] = await Promise.all([
    client
      .from("catalog_packages")
      .select("key, name")
      .order("sort_order"),
    client.from("catalog_addons").select("name").order("sort_order"),
  ]);

  const packages: PackagePayRateEditorRow[] = (catalogPkgs ?? []).map((row) => {
    const key = row.key as string;
    const pay = rates.packages.get(key);
    const defaults = DEFAULT_PACKAGE_PAY_RATES[key];
    return {
      packageKey: key,
      packageName: row.name as string,
      regularCents: pay?.regular ?? defaults?.regular ?? 0,
      seniorCents: pay?.senior ?? defaults?.senior ?? 0,
    };
  });

  const addonKeySet = new Set<string>([
    ...rates.addons.keys(),
    ...Object.keys(DEFAULT_ADDON_PAY_RATES),
  ]);
  for (const row of catalogAddons ?? []) {
    addonKeySet.add(normalizeAddonPayKey(row.name as string));
  }

  const addons: AddonPayRateEditorRow[] = [...addonKeySet]
    .sort((a, b) => a.localeCompare(b))
    .map((addonKey) => {
      const pay = rates.addons.get(addonKey);
      const defaults = DEFAULT_ADDON_PAY_RATES[addonKey];
      const catalogMatch = (catalogAddons ?? []).find(
        (a) => normalizeAddonPayKey(a.name as string) === addonKey,
      );
      return {
        addonKey,
        displayLabel: catalogMatch?.name ?? addonKey,
        regularCents: pay?.regular ?? defaults?.regular ?? 0,
        seniorCents: pay?.senior ?? defaults?.senior ?? 0,
        fieldId: addonPayFieldId(addonKey),
      };
    });

  return { packages, addons };
}

export async function upsertPackagePayRates(
  client: SupabaseClient,
  rows: { packageKey: string; regularCents: number; seniorCents: number }[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!rows.length) return { ok: true };

  const { error } = await client.from("detailer_package_pay_rates").upsert(
    rows.map((r) => ({
      package_key: r.packageKey,
      regular_pay_cents: r.regularCents,
      senior_pay_cents: r.seniorCents,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "package_key" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function upsertAddonPayRates(
  client: SupabaseClient,
  rows: { addonKey: string; regularCents: number; seniorCents: number }[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!rows.length) return { ok: true };

  const { error } = await client.from("detailer_addon_pay_rates").upsert(
    rows.map((r) => ({
      addon_name: r.addonKey,
      regular_pay_cents: r.regularCents,
      senior_pay_cents: r.seniorCents,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "addon_name" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchDetailerPayRates(
  client: SupabaseClient | null,
): Promise<DetailerPayRatesSnapshot> {
  const packages = new Map(
    Object.entries(DEFAULT_PACKAGE_PAY_RATES).map(([k, v]) => [k, { ...v }]),
  );
  const addons = new Map(
    Object.entries(DEFAULT_ADDON_PAY_RATES).map(([k, v]) => [k, { ...v }]),
  );

  if (!client) {
    return { packages, addons };
  }

  const [{ data: pkgRows }, { data: addonRows }] = await Promise.all([
    client.from("detailer_package_pay_rates").select("package_key, regular_pay_cents, senior_pay_cents"),
    client.from("detailer_addon_pay_rates").select("addon_name, regular_pay_cents, senior_pay_cents"),
  ]);

  for (const row of pkgRows ?? []) {
    packages.set(row.package_key as string, {
      regular: row.regular_pay_cents as number,
      senior: row.senior_pay_cents as number,
    });
  }

  for (const row of addonRows ?? []) {
    addons.set(row.addon_name as string, {
      regular: row.regular_pay_cents as number,
      senior: row.senior_pay_cents as number,
    });
  }

  return { packages, addons };
}

export function packagePayCents(
  rates: DetailerPayRatesSnapshot,
  packageKey: string | null | undefined,
  isSenior: boolean,
): number {
  const key = packageKey?.trim();
  if (!key) return 0;
  const row = rates.packages.get(key);
  if (!row) return 0;
  return isSenior ? row.senior : row.regular;
}

export function addonPayCents(
  rates: DetailerPayRatesSnapshot,
  addonName: string,
  isSenior: boolean,
): number {
  const key = normalizeAddonPayKey(addonName);
  const row = rates.addons.get(key);
  if (!row) return 0;
  return isSenior ? row.senior : row.regular;
}
