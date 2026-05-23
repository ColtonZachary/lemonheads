"use client";

import { useActionState } from "react";

import {
  addCoverageRule,
  deleteCoverageRule,
  updateServiceAreaTravelMinutes,
  type HubCoverageActionState,
} from "@/app/actions/hub-coverage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMPTY: HubCoverageActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-2.5 py-1.5 text-sm";
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
        {pending ? "…" : "Remove"}
      </Button>
      {!state.ok && state.message && (
        <span className="ml-2 font-mono text-[9px] text-red-300">{state.message}</span>
      )}
    </form>
  );
}

function formatRule(row: CoverageRuleRow): string {
  if (row.zip_prefix) return `ZIP ${row.zip_prefix}*`;
  if (row.city_name) return `City: ${row.city_name}`;
  return "—";
}

function TravelMinutesRow({
  area,
}: {
  area: { slug: string; city: string; state: string; travelMinutesFromShop: number };
}) {
  const [state, action, pending] = useActionState(
    updateServiceAreaTravelMinutes,
    EMPTY,
  );

  return (
    <form
      action={action}
      className="flex flex-wrap items-end justify-between gap-3 border-b border-white/5 px-3 py-2.5 last:border-0"
    >
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
          {area.city}, {area.state}
        </p>
        <p className="font-mono text-[9px] text-text/35">
          {area.travelMinutesFromShop >= 60
            ? "Next-day booking · 8:30 AM earliest"
            : area.slug === "enid" || area.city.toLowerCase() === "enid"
              ? "8:30 AM earliest"
              : "Standard slots"}
        </p>
      </div>
      <input type="hidden" name="slug" value={area.slug} />
      <label className="flex items-end gap-2">
        <span className={labelClass}>Min from shop</span>
        <input
          name="travel_minutes"
          type="number"
          min={0}
          max={600}
          defaultValue={String(area.travelMinutesFromShop)}
          className={cn(fieldClass, "w-24")}
        />
      </label>
      <Button
        type="submit"
        variant="outline"
        className="h-auto min-h-0 px-2 py-1 text-[10px]"
        disabled={pending}
      >
        {pending ? "…" : "Save"}
      </Button>
      {!state.ok && state.message ? (
        <span className="w-full font-mono text-[9px] text-red-300">{state.message}</span>
      ) : null}
    </form>
  );
}

export function ServiceAreaCoveragePanel({
  serviceAreas,
  rules,
}: {
  serviceAreas: {
    slug: string;
    city: string;
    state: string;
    travelMinutesFromShop: number;
  }[];
  rules: CoverageRuleRow[];
}) {
  const [createState, createAction, createPending] = useActionState(
    addCoverageRule,
    EMPTY,
  );

  const areaLabel = new Map(
    serviceAreas.map((a) => [a.slug, `${a.city}, ${a.state}`]),
  );

  const flatRules = rules.map((r) => ({
    ...r,
    areaName: areaLabel.get(r.service_area_slug) ?? r.service_area_slug,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Service areas
          </p>
          <p className="font-display text-2xl text-y">{serviceAreas.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Active rules
          </p>
          <p className="font-display text-2xl text-y">{rules.length}</p>
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Travel time from Edmond shop
          </h2>
          <span className="font-mono text-[9px] text-text/35">
            60+ min → next day · 8:30 earliest
          </span>
        </div>
        <p className="mb-2 text-xs text-text/45">
          Estimated drive minutes used for booking rules — no Google API at checkout.
        </p>
        <ul className="rounded-lg border border-white/10">
          {serviceAreas.map((area) => (
            <TravelMinutesRow key={area.slug} area={area} />
          ))}
        </ul>
      </section>

      <details className="rounded-lg border border-white/10 bg-card/30">
        <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-y [&::-webkit-details-marker]:hidden">
          + Add coverage rule
        </summary>
        <form action={createAction} className="border-t border-white/10 px-4 py-4">
          <p className="text-xs text-text/45">
            ZIP prefix matches ranges (e.g. 731 → all 731xx). City matches customer
            city field.
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Service area *</span>
              <select name="service_area_slug" required className={fieldClass} defaultValue="">
                <option value="" disabled>
                  Select…
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
          <Button
            type="submit"
            className="mt-4 h-auto min-h-0 px-4 py-2 text-xs"
            disabled={createPending}
          >
            {createPending ? "Adding…" : "Add rule"}
          </Button>
          {createState.message ? (
            <p
              className={cn(
                "mt-3 rounded border px-3 py-2 font-mono text-[10px]",
                createState.ok
                  ? "border-y/30 bg-y/10 text-y"
                  : "border-red-500/30 bg-red-500/10 text-red-200",
              )}
            >
              {createState.message}
            </p>
          ) : null}
        </form>
      </details>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Coverage rules
          </h2>
          <span className="font-mono text-[9px] text-text/35">Edmond drop-off always allowed</span>
        </div>
        {!flatRules.length ? (
          <p className="rounded-lg border border-white/10 px-4 py-6 text-sm text-text/40">
            No rules — mobile bookings allowed everywhere until you add ZIP or city
            rules. Run <code className="text-y/70">npm run hub:seed</code> for defaults.
          </p>
        ) : (
          <ul className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-white/10">
            {flatRules.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2 last:border-0"
              >
                <div className="min-w-0 text-sm">
                  <span className="font-mono text-[9px] text-y/60">{r.areaName}</span>
                  <span className="ml-2 text-text/70">{formatRule(r)}</span>
                </div>
                <DeleteCoverageButton id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
