"use client";

import { useActionState } from "react";

import {
  createPromoCode,
  deletePromoCode,
  updatePromoCode,
  type HubPromoActionState,
} from "@/app/actions/hub-promos";
import { Button } from "@/components/ui/button";
import { BUSINESS_TIME_ZONE } from "@/lib/bookings/parse-schedule";
import {
  formatPromoDiscount,
  formatPromoPackageScope,
  type PromoCodeRow,
} from "@/lib/hub/promo-db";
import { cn } from "@/lib/utils";

const EMPTY: HubPromoActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

function dateInputValue(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
  });
}

function fixedDollars(cents: number): string {
  return cents > 0 ? String(cents / 100) : "";
}

export type PromoPackageOption = { key: string; name: string };

function PackageScopeFields({
  packageOptions,
  defaultScope,
  defaultPackageKey,
}: {
  packageOptions: PromoPackageOption[];
  defaultScope: "all" | "single";
  defaultPackageKey?: string;
}) {
  return (
    <>
      <label className="block sm:col-span-2">
        <span className={labelClass}>Applies to *</span>
        <select name="package_scope" defaultValue={defaultScope} className={fieldClass}>
          <option value="all">All packages</option>
          <option value="single">Single package only</option>
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={labelClass}>Package (when single)</span>
        <select
          name="package_key"
          defaultValue={defaultPackageKey ?? ""}
          className={fieldClass}
        >
          <option value="">Select package…</option>
          {packageOptions.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function promoStatus(promo: PromoCodeRow): { label: string; className: string } | null {
  const now = Date.now();
  if (!promo.active) {
    return { label: "Inactive", className: "bg-white/10 text-text/50" };
  }
  if (promo.valid_from && new Date(promo.valid_from).getTime() > now) {
    return { label: "Scheduled", className: "bg-y/10 text-y/70" };
  }
  if (promo.valid_until && new Date(promo.valid_until).getTime() < now) {
    return { label: "Expired", className: "bg-red-500/10 text-red-200" };
  }
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return { label: "Max uses reached", className: "bg-red-500/10 text-red-200" };
  }
  return { label: "Active", className: "bg-y/10 text-y/70" };
}

function PromoEditForm({
  promo,
  packageOptions,
}: {
  promo: PromoCodeRow;
  packageOptions: PromoPackageOption[];
}) {
  const [state, action, pending] = useActionState(
    updatePromoCode.bind(null, promo.id),
    EMPTY,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deletePromoCode.bind(null, promo.id),
    EMPTY,
  );
  const busy = pending || deletePending;
  const feedback = deleteState.message || state.message;
  const feedbackOk = deleteState.message ? deleteState.ok : state.ok;
  const status = promoStatus(promo);

  return (
    <form action={action} className="mt-4 space-y-4 border-t border-white/10 pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Code *</span>
          <input
            name="code"
            required
            defaultValue={promo.code}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Label (internal)</span>
          <input name="label" defaultValue={promo.label} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Discount type *</span>
          <select
            name="discount_type"
            defaultValue={promo.discount_type}
            className={fieldClass}
          >
            <option value="percent">Percent off</option>
            <option value="fixed_cents">Fixed amount off ($)</option>
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Percent off (if percent type)</span>
          <input
            name="discount_percent"
            inputMode="decimal"
            defaultValue={
              promo.discount_type === "percent" ? String(promo.discount_value) : ""
            }
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Amount off $ (if fixed type)</span>
          <input
            name="discount_amount"
            inputMode="decimal"
            defaultValue={
              promo.discount_type === "fixed_cents"
                ? fixedDollars(promo.discount_value)
                : ""
            }
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Max uses (blank = unlimited)</span>
          <input
            name="max_uses"
            type="number"
            min="1"
            defaultValue={promo.max_uses ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Times used</span>
          <input
            readOnly
            value={String(promo.uses_count)}
            className={cn(fieldClass, "opacity-60")}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Valid from (optional)</span>
          <input
            name="valid_from"
            type="date"
            defaultValue={dateInputValue(promo.valid_from)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Valid until (optional)</span>
          <input
            name="valid_until"
            type="date"
            defaultValue={dateInputValue(promo.valid_until)}
            className={fieldClass}
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm sm:col-span-2">
          <input type="checkbox" name="active" defaultChecked={promo.active} className="size-4" />
          Active
        </label>
        <PackageScopeFields
          packageOptions={packageOptions}
          defaultScope={promo.package_key ? "single" : "all"}
          defaultPackageKey={promo.package_key ?? undefined}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy} className="h-auto min-h-0 px-3 py-1.5 text-xs">
          {pending ? "Saving…" : "Save promo"}
        </Button>
        <Button
          type="submit"
          formAction={deleteAction}
          variant="outline"
          disabled={busy}
          className="h-auto min-h-0 border-red-500/30 px-3 py-1.5 text-xs text-red-200"
          onClick={(e) => {
            if (!confirm(`Delete promo “${promo.code}”?`)) {
              e.preventDefault();
            }
          }}
        >
          {deletePending ? "Deleting…" : "Delete"}
        </Button>
        {status && (
          <span
            className={cn(
              "self-center rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
              status.className,
            )}
          >
            {status.label}
          </span>
        )}
      </div>

      {feedback && (
        <p className={cn("font-mono text-xs", feedbackOk ? "text-y" : "text-red-200")}>
          {feedback}
        </p>
      )}
    </form>
  );
}

export function PromoCodesPanel({
  promos,
  packageOptions,
}: {
  promos: PromoCodeRow[];
  packageOptions: PromoPackageOption[];
}) {
  const packageNames = Object.fromEntries(
    packageOptions.map((p) => [p.key, p.name]),
  );
  const [createState, createAction, createPending] = useActionState(
    createPromoCode,
    EMPTY,
  );

  return (
    <div className="space-y-10">
      <form action={createAction} className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Add promo code
        </h2>
        <p className="mt-1 font-mono text-[9px] text-text/35">
          Codes are uppercased automatically. Customers enter them on the booking page after
          choosing a package.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Code *</span>
            <input
              name="code"
              required
              placeholder="SUMMER25"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Label (internal)</span>
            <input name="label" placeholder="Summer campaign" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Discount type *</span>
            <select name="discount_type" defaultValue="percent" className={fieldClass}>
              <option value="percent">Percent off</option>
              <option value="fixed_cents">Fixed amount off ($)</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Percent off (if percent type)</span>
            <input
              name="discount_percent"
              inputMode="decimal"
              placeholder="10"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Amount off $ (if fixed type)</span>
            <input
              name="discount_amount"
              inputMode="decimal"
              placeholder="25"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Max uses (blank = unlimited)</span>
            <input name="max_uses" type="number" min="1" className={fieldClass} />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="active" defaultChecked className="size-4" />
            Active
          </label>
          <label className="block">
            <span className={labelClass}>Valid from (optional)</span>
            <input name="valid_from" type="date" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Valid until (optional)</span>
            <input name="valid_until" type="date" className={fieldClass} />
          </label>
          <PackageScopeFields packageOptions={packageOptions} defaultScope="all" />
        </div>
        <Button type="submit" className="mt-6" disabled={createPending}>
          {createPending ? "Adding…" : "Add promo"}
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

      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Promo codes ({promos.length})
        </h3>
        {!promos.length ? (
          <p className="mt-4 text-sm text-text/40">No promo codes yet. Add one above.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {promos.map((promo) => {
              const status = promoStatus(promo);
              return (
                <li
                  key={promo.id}
                  className={cn(
                    "rounded-md border px-4 py-4",
                    promo.active ? "border-white/10" : "border-white/5 opacity-70",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-y/85">{promo.code}</span>
                    <span className="font-mono text-[9px] text-text/45">
                      {formatPromoDiscount(promo)}
                      {promo.label ? ` · ${promo.label}` : ""}
                      {" · "}
                      {formatPromoPackageScope(promo.package_key, packageNames)}
                    </span>
                    {status && (
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
                          status.className,
                        )}
                      >
                        {status.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-text/35">
                    Uses: {promo.uses_count}
                    {promo.max_uses !== null ? ` / ${promo.max_uses}` : " (unlimited)"}
                    {promo.valid_from || promo.valid_until
                      ? ` · ${promo.valid_from ? dateInputValue(promo.valid_from) : "…"} → ${promo.valid_until ? dateInputValue(promo.valid_until) : "…"}`
                      : ""}
                  </p>
                  <PromoEditForm promo={promo} packageOptions={packageOptions} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
