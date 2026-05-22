"use server";

import { revalidatePath } from "next/cache";

import {
  fetchPayRatesForEditor,
  parsePayDollarsInput,
  upsertAddonPayRates,
  upsertPackagePayRates,
} from "@/lib/hub/detailer-pay-rates";
import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";

export type HubPayRatesActionState = {
  ok: boolean;
  message: string;
};

const REVALIDATE_PATHS = [
  "/hub/settings/pay-rates",
  "/hub/reports",
  "/hub/pay",
];

function revalidatePayPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function saveDetailerPayRates(
  _prev: HubPayRatesActionState,
  formData: FormData,
): Promise<HubPayRatesActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { packages: pkgDefs, addons: addonDefs } = await fetchPayRatesForEditor(
    ctx.supabase,
  );

  const packageRows: {
    packageKey: string;
    regularCents: number;
    seniorCents: number;
  }[] = [];

  for (const pkg of pkgDefs) {
    const regular = parsePayDollarsInput(
      String(formData.get(`pkg_regular_${pkg.packageKey}`) ?? ""),
    );
    const senior = parsePayDollarsInput(
      String(formData.get(`pkg_senior_${pkg.packageKey}`) ?? ""),
    );
    if (regular === null || senior === null) {
      return {
        ok: false,
        message: `Enter valid Regular and Senior pay for ${pkg.packageName}.`,
      };
    }
    packageRows.push({
      packageKey: pkg.packageKey,
      regularCents: regular,
      seniorCents: senior,
    });
  }

  const addonRows: {
    addonKey: string;
    regularCents: number;
    seniorCents: number;
  }[] = [];

  for (const addon of addonDefs) {
    const regular = parsePayDollarsInput(
      String(formData.get(`addon_regular_${addon.fieldId}`) ?? ""),
    );
    const senior = parsePayDollarsInput(
      String(formData.get(`addon_senior_${addon.fieldId}`) ?? ""),
    );
    if (regular === null || senior === null) {
      return {
        ok: false,
        message: `Enter valid pay for add-on “${addon.displayLabel}”.`,
      };
    }
    addonRows.push({
      addonKey: addon.addonKey,
      regularCents: regular,
      seniorCents: senior,
    });
  }

  const pkgResult = await upsertPackagePayRates(ctx.supabase, packageRows);
  if (!pkgResult.ok) {
    return { ok: false, message: pkgResult.error };
  }

  const addonResult = await upsertAddonPayRates(ctx.supabase, addonRows);
  if (!addonResult.ok) {
    return { ok: false, message: addonResult.error };
  }

  revalidatePayPaths();

  return {
    ok: true,
    message: "Detailer pay rates saved. Reports and My pay will use the new amounts.",
  };
}
