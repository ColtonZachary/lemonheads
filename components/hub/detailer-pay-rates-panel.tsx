"use client";

import { useActionState } from "react";

import {
  saveDetailerPayRates,
  type HubPayRatesActionState,
} from "@/app/actions/hub-pay-rates";
import { Button } from "@/components/ui/button";
import {
  formatPayDollarsInput,
  type AddonPayRateEditorRow,
  type PackagePayRateEditorRow,
} from "@/lib/hub/detailer-pay-rates";
import { cn } from "@/lib/utils";

const EMPTY: HubPayRatesActionState = { ok: false, message: "" };

const fieldClass =
  "w-full rounded border border-white/15 bg-dk px-2 py-1.5 text-right font-mono text-sm";

export function DetailerPayRatesPanel({
  packages,
  addons,
}: {
  packages: PackagePayRateEditorRow[];
  addons: AddonPayRateEditorRow[];
}) {
  const [state, action, pending] = useActionState(saveDetailerPayRates, EMPTY);

  return (
    <form action={action} className="space-y-6">
      {state.message ? (
        <p
          className={cn(
            "rounded border px-3 py-2 font-mono text-[10px]",
            state.ok
              ? "border-y/30 bg-y/10 text-y"
              : "border-red-500/30 bg-red-500/10 text-red-200",
          )}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-white/10">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
            Packages
          </h2>
          <p className="mt-1 text-xs text-text/45">
            Flat pay per job by package · Senior is usually $5 more than Regular
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-card2/60 font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
                <th className="px-4 py-2.5">Package</th>
                <th className="px-4 py-2.5 text-right">Regular ($)</th>
                <th className="px-4 py-2.5 text-right">Senior ($)</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr
                  key={pkg.packageKey}
                  className="border-b border-white/5 font-mono text-xs"
                >
                  <td className="px-4 py-2.5 text-text/85">{pkg.packageName}</td>
                  <td className="px-4 py-2.5">
                    <label className="sr-only">Regular pay for {pkg.packageName}</label>
                    <input
                      name={`pkg_regular_${pkg.packageKey}`}
                      inputMode="decimal"
                      required
                      defaultValue={formatPayDollarsInput(pkg.regularCents)}
                      className={fieldClass}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <label className="sr-only">Senior pay for {pkg.packageName}</label>
                    <input
                      name={`pkg_senior_${pkg.packageKey}`}
                      inputMode="decimal"
                      required
                      defaultValue={formatPayDollarsInput(pkg.seniorCents)}
                      className={fieldClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-white/10">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
            Add-ons
          </h2>
          <p className="mt-1 text-xs text-text/45">
            Pay per add-on on a booking · matched by add-on name (Regular and Senior
            are often the same)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-card2/60 font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
                <th className="px-4 py-2.5">Add-on</th>
                <th className="px-4 py-2.5 text-right">Regular ($)</th>
                <th className="px-4 py-2.5 text-right">Senior ($)</th>
              </tr>
            </thead>
            <tbody>
              {addons.map((addon) => (
                <tr
                  key={addon.addonKey}
                  className="border-b border-white/5 font-mono text-xs"
                >
                  <td className="px-4 py-2.5 text-text/85">{addon.displayLabel}</td>
                  <td className="px-4 py-2.5">
                    <input
                      name={`addon_regular_${addon.fieldId}`}
                      inputMode="decimal"
                      required
                      defaultValue={formatPayDollarsInput(addon.regularCents)}
                      className={fieldClass}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      name={`addon_senior_${addon.fieldId}`}
                      inputMode="decimal"
                      required
                      defaultValue={formatPayDollarsInput(addon.seniorCents)}
                      className={fieldClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Button
        type="submit"
        disabled={pending}
        className="h-auto min-h-0 px-4 py-2 text-xs"
      >
        {pending ? "Saving…" : "Save pay rates"}
      </Button>
    </form>
  );
}
