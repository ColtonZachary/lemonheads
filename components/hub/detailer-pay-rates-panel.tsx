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
  "w-full rounded border border-white/15 bg-dk px-2 py-1 text-right font-mono text-xs";

export function DetailerPayRatesPanel({
  packages,
  addons,
}: {
  packages: PackagePayRateEditorRow[];
  addons: AddonPayRateEditorRow[];
}) {
  const [state, action, pending] = useActionState(saveDetailerPayRates, EMPTY);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Packages
          </p>
          <p className="font-display text-2xl text-y">{packages.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Add-ons
          </p>
          <p className="font-display text-2xl text-y">{addons.length}</p>
        </div>
      </div>

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

        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              Package pay
            </h2>
            <span className="font-mono text-[9px] text-text/35">
              Flat per job · Senior usually +$5
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-card2/60 font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
                  <th className="px-3 py-2">Package</th>
                  <th className="px-3 py-2 text-right">Regular ($)</th>
                  <th className="px-3 py-2 text-right">Senior ($)</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr
                    key={pkg.packageKey}
                    className="border-b border-white/5 font-mono text-xs last:border-0"
                  >
                    <td className="px-3 py-2 text-text/85">{pkg.packageName}</td>
                    <td className="px-3 py-2">
                      <label className="sr-only">Regular pay for {pkg.packageName}</label>
                      <input
                        name={`pkg_regular_${pkg.packageKey}`}
                        inputMode="decimal"
                        required
                        defaultValue={formatPayDollarsInput(pkg.regularCents)}
                        className={fieldClass}
                      />
                    </td>
                    <td className="px-3 py-2">
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

        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              Add-on pay
            </h2>
            <span className="font-mono text-[9px] text-text/35">Per add-on on a booking</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-card2/60 font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
                  <th className="px-3 py-2">Add-on</th>
                  <th className="px-3 py-2 text-right">Regular ($)</th>
                  <th className="px-3 py-2 text-right">Senior ($)</th>
                </tr>
              </thead>
              <tbody>
                {addons.map((addon) => (
                  <tr
                    key={addon.addonKey}
                    className="border-b border-white/5 font-mono text-xs last:border-0"
                  >
                    <td className="px-3 py-2 text-text/85">{addon.displayLabel}</td>
                    <td className="px-3 py-2">
                      <input
                        name={`addon_regular_${addon.fieldId}`}
                        inputMode="decimal"
                        required
                        defaultValue={formatPayDollarsInput(addon.regularCents)}
                        className={fieldClass}
                      />
                    </td>
                    <td className="px-3 py-2">
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
    </div>
  );
}
