"use client";

import { useActionState } from "react";

import {
  addCoverageRule,
  deleteCoverageRule,
  type HubCoverageActionState,
} from "@/app/actions/hub-coverage";
import { Button } from "@/components/ui/button";

const EMPTY: HubCoverageActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export type CoverageRuleRow = {
  id: string;
  service_area_slug: string;
  zip_prefix: string | null;
  city_name: string | null;
  active: boolean;
};

function DeleteCoverageButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    deleteCoverageRule.bind(null, id),
    EMPTY,
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Remove this coverage rule?")) e.preventDefault();
      }}
    >
      <Button
        type="submit"
        variant="outline"
        className="h-auto min-h-0 px-2 py-1 text-[10px]"
        disabled={pending}
      >
        Remove
      </Button>
      {!state.ok && state.message && (
        <span className="ml-2 font-mono text-[9px] text-red-300">{state.message}</span>
      )}
    </form>
  );
}

function formatRule(row: CoverageRuleRow): string {
  if (row.zip_prefix) {
    return `ZIP starts with ${row.zip_prefix}`;
  }
  if (row.city_name) {
    return `City: ${row.city_name}`;
  }
  return "—";
}

export function ServiceAreaCoveragePanel({
  serviceAreas,
  rules,
}: {
  serviceAreas: { slug: string; city: string; state: string }[];
  rules: CoverageRuleRow[];
}) {
  const [createState, createAction, createPending] = useActionState(
    addCoverageRule,
    EMPTY,
  );

  const byArea = new Map<string, CoverageRuleRow[]>();
  for (const r of rules) {
    const list = byArea.get(r.service_area_slug) ?? [];
    list.push(r);
    byArea.set(r.service_area_slug, list);
  }

  return (
    <div className="space-y-10">
      <form action={createAction} className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Add coverage rule
        </h2>
        <p className="mt-1 text-sm text-text/45">
          ZIP prefixes match whole ranges (e.g.{" "}
          <span className="font-mono text-y/70">731</span> covers all 731xx in OKC).
          City names match when the customer enters that city.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Service area *</span>
            <select name="service_area_slug" required className={fieldClass} defaultValue="">
              <option value="" disabled>
                Select city…
              </option>
              {serviceAreas.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.city}, {a.state}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Rule type *</span>
            <select name="rule_type" required className={fieldClass} defaultValue="zip">
              <option value="zip">ZIP prefix</option>
              <option value="city">City name</option>
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Value *</span>
            <input
              name="value"
              required
              placeholder="731 or Oklahoma City"
              className={fieldClass}
            />
          </label>
        </div>

        <Button type="submit" className="mt-6" disabled={createPending}>
          {createPending ? "Adding…" : "Add rule"}
        </Button>

        {createState.message && (
          <p
            className={`mt-4 rounded-md border px-4 py-3 font-mono text-xs ${
              createState.ok
                ? "border-y/30 bg-y/10 text-y"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {createState.message}
          </p>
        )}
      </form>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Active coverage
        </h3>
        {!rules.length ? (
          <p className="mt-4 text-sm text-text/40">
            No rules yet — mobile bookings are allowed everywhere until you add
            ZIP or city rules. Run{" "}
            <code className="text-y/70">npm run hub:seed</code> for OKC/Tulsa/Enid
            defaults.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {serviceAreas.map((area) => {
              const areaRules = byArea.get(area.slug) ?? [];
              if (!areaRules.length) return null;
              return (
                <li
                  key={area.slug}
                  className="rounded-md border border-white/10 px-4 py-4"
                >
                  <div className="font-mono text-sm text-y/85">
                    {area.city}, {area.state}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {areaRules.map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm text-text/60"
                      >
                        <span>{formatRule(r)}</span>
                        <DeleteCoverageButton id={r.id} />
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="font-mono text-[9px] text-text/35">
        Drop-off at Edmond is always allowed. Home and workplace visits require a
        matching ZIP prefix or city. Customers outside coverage see your
        exception message and cannot complete booking online.
      </p>
    </div>
  );
}
