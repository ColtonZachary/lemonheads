"use client";

import { useActionState, useState } from "react";

import {
  createPromoCode,
  deletePromoCode,
  updatePromoCode,
  type HubPromoActionState,
} from "@/app/actions/hub-promos";
import {
  HubActionAlert,
  HubDetailsSection,
  HubEmptyState,
} from "@/components/hub/hub-page";
import {
  HubFieldRow,
  HubFormField,
  HubFormSection,
  HubInput,
  HubNativeSelect,
} from "@/components/hub/hub-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BUSINESS_TIME_ZONE } from "@/lib/bookings/parse-schedule";
import {
  formatPromoDiscount,
  formatPromoPackageScope,
  type PromoCodeRow,
} from "@/lib/hub/promo-db";
import { cn } from "@/lib/utils";

const EMPTY: HubPromoActionState = { ok: false, message: "" };

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
  idPrefix = "",
}: {
  packageOptions: PromoPackageOption[];
  defaultScope: "all" | "single";
  defaultPackageKey?: string;
  idPrefix?: string;
}) {
  return (
    <>
      <HubFormField label="Applies to" htmlFor={`${idPrefix}package_scope`} required>
        <HubNativeSelect
          id={`${idPrefix}package_scope`}
          name="package_scope"
          defaultValue={defaultScope}
        >
          <option value="all">All packages</option>
          <option value="single">Single package only</option>
        </HubNativeSelect>
      </HubFormField>
      <HubFormField label="Package (when single)" htmlFor={`${idPrefix}package_key`}>
        <HubNativeSelect
          id={`${idPrefix}package_key`}
          name="package_key"
          defaultValue={defaultPackageKey ?? ""}
        >
          <option value="">Select package…</option>
          {packageOptions.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </HubNativeSelect>
      </HubFormField>
    </>
  );
}

function promoStatus(promo: PromoCodeRow): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} | null {
  const now = Date.now();
  if (!promo.active) {
    return { label: "Inactive", variant: "outline" };
  }
  if (promo.valid_from && new Date(promo.valid_from).getTime() > now) {
    return { label: "Scheduled", variant: "secondary" };
  }
  if (promo.valid_until && new Date(promo.valid_until).getTime() < now) {
    return { label: "Expired", variant: "destructive" };
  }
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return { label: "Max uses reached", variant: "destructive" };
  }
  return { label: "Active", variant: "default" };
}

function PromoStatusBadge({ promo }: { promo: PromoCodeRow }) {
  const status = promoStatus(promo);
  if (!status) return null;
  return (
    <Badge variant={status.variant} className="font-mono text-[8px] uppercase">
      {status.label}
    </Badge>
  );
}

function PromoFormFields({
  promo,
  packageOptions,
  idPrefix,
}: {
  promo?: PromoCodeRow;
  packageOptions: PromoPackageOption[];
  idPrefix: string;
}) {
  return (
    <HubFieldRow>
      <HubFormField label="Code" htmlFor={`${idPrefix}code`} required>
        <HubInput
          id={`${idPrefix}code`}
          name="code"
          required
          defaultValue={promo?.code}
          placeholder={promo ? undefined : "SUMMER25"}
        />
      </HubFormField>
      <HubFormField label="Label (internal)" htmlFor={`${idPrefix}label`}>
        <HubInput
          id={`${idPrefix}label`}
          name="label"
          defaultValue={promo?.label ?? ""}
          placeholder={promo ? undefined : "Summer campaign"}
        />
      </HubFormField>
      <HubFormField label="Discount type" htmlFor={`${idPrefix}discount_type`} required>
        <HubNativeSelect
          id={`${idPrefix}discount_type`}
          name="discount_type"
          defaultValue={promo?.discount_type ?? "percent"}
        >
          <option value="percent">Percent off</option>
          <option value="fixed_cents">Fixed amount off ($)</option>
        </HubNativeSelect>
      </HubFormField>
      <HubFormField label="Percent off (if percent type)" htmlFor={`${idPrefix}discount_percent`}>
        <HubInput
          id={`${idPrefix}discount_percent`}
          name="discount_percent"
          inputMode="decimal"
          defaultValue={
            promo?.discount_type === "percent" ? String(promo.discount_value) : ""
          }
          placeholder={promo ? undefined : "10"}
        />
      </HubFormField>
      <HubFormField label="Amount off $ (if fixed type)" htmlFor={`${idPrefix}discount_amount`}>
        <HubInput
          id={`${idPrefix}discount_amount`}
          name="discount_amount"
          inputMode="decimal"
          defaultValue={
            promo?.discount_type === "fixed_cents"
              ? fixedDollars(promo.discount_value)
              : ""
          }
          placeholder={promo ? undefined : "25"}
        />
      </HubFormField>
      <HubFormField label="Max uses (blank = unlimited)" htmlFor={`${idPrefix}max_uses`}>
        <HubInput
          id={`${idPrefix}max_uses`}
          name="max_uses"
          type="number"
          min="1"
          defaultValue={promo?.max_uses ?? ""}
        />
      </HubFormField>
      {promo ? (
        <HubFormField label="Times used" htmlFor={`${idPrefix}uses_count`}>
          <HubInput
            id={`${idPrefix}uses_count`}
            readOnly
            value={String(promo.uses_count)}
            className="opacity-60"
          />
        </HubFormField>
      ) : null}
      <HubFormField label="Valid from (optional)" htmlFor={`${idPrefix}valid_from`}>
        <HubInput
          id={`${idPrefix}valid_from`}
          name="valid_from"
          type="date"
          defaultValue={promo ? dateInputValue(promo.valid_from) : ""}
          className="hub-date-input"
        />
      </HubFormField>
      <HubFormField label="Valid until (optional)" htmlFor={`${idPrefix}valid_until`}>
        <HubInput
          id={`${idPrefix}valid_until`}
          name="valid_until"
          type="date"
          defaultValue={promo ? dateInputValue(promo.valid_until) : ""}
          className="hub-date-input"
        />
      </HubFormField>
      <label className="flex items-center gap-2 pb-1 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="active"
          defaultChecked={promo ? promo.active : true}
          className="size-4 rounded border-input"
        />
        Active
      </label>
      <PackageScopeFields
        idPrefix={idPrefix}
        packageOptions={packageOptions}
        defaultScope={promo?.package_key ? "single" : "all"}
        defaultPackageKey={promo?.package_key ?? undefined}
      />
    </HubFieldRow>
  );
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

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-3 py-4 sm:px-4">
      <PromoFormFields
        promo={promo}
        packageOptions={packageOptions}
        idPrefix={`edit-${promo.id}-`}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {pending ? "Saving…" : "Save promo"}
        </Button>
        <Button
          type="submit"
          formAction={deleteAction}
          variant="outline"
          size="sm"
          disabled={busy}
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            if (!confirm(`Delete promo “${promo.code}”?`)) {
              e.preventDefault();
            }
          }}
        >
          {deletePending ? "Deleting…" : "Delete"}
        </Button>
        <PromoStatusBadge promo={promo} />
      </div>

      <HubActionAlert
        state={{
          ok: deleteState.message ? deleteState.ok : state.ok,
          message: deleteState.message || state.message,
        }}
        className="mt-3"
      />
    </form>
  );
}

function PromoListRow({
  promo,
  packageOptions,
  packageNames,
  expanded,
  onToggleEdit,
}: {
  promo: PromoCodeRow;
  packageOptions: PromoPackageOption[];
  packageNames: Record<string, string>;
  expanded: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80",
        !promo.active && "opacity-75",
        expanded && "border-primary/30",
      )}
    >
      <div className="flex items-start gap-3 px-3 py-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-primary">{promo.code}</span>
            <PromoStatusBadge promo={promo} />
          </div>
          <p className="mt-1 font-mono text-[9px] text-muted-foreground">
            {formatPromoDiscount(promo)}
            {promo.label ? ` · ${promo.label}` : ""}
            {" · "}
            {formatPromoPackageScope(promo.package_key, packageNames)}
          </p>
          <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/80">
            Uses: {promo.uses_count}
            {promo.max_uses !== null ? ` / ${promo.max_uses}` : " (unlimited)"}
            {promo.valid_from || promo.valid_until
              ? ` · ${promo.valid_from ? dateInputValue(promo.valid_from) : "…"} → ${promo.valid_until ? dateInputValue(promo.valid_until) : "…"}`
              : ""}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onToggleEdit}>
          {expanded ? "Close" : "Edit"}
        </Button>
      </div>
      {expanded ? (
        <PromoEditForm promo={promo} packageOptions={packageOptions} />
      ) : null}
    </Card>
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <HubDetailsSection summary="+ Add promo code">
        <p className="mb-4 text-xs text-muted-foreground">
          Codes are uppercased automatically. Customers enter them on the booking page
          after choosing a package.
        </p>
        <form action={createAction}>
          <PromoFormFields packageOptions={packageOptions} idPrefix="create-" />
          <Button type="submit" className="mt-4" disabled={createPending}>
            {createPending ? "Adding…" : "Add promo"}
          </Button>
          <HubActionAlert state={createState} className="mt-4" />
        </form>
      </HubDetailsSection>

      <HubFormSection title={`Promo codes (${promos.length})`}>
        {!promos.length ? (
          <HubEmptyState>No promo codes yet. Add one above.</HubEmptyState>
        ) : (
          <ul className="space-y-3">
            {promos.map((promo) => (
              <li key={promo.id}>
                <PromoListRow
                  promo={promo}
                  packageOptions={packageOptions}
                  packageNames={packageNames}
                  expanded={expandedId === promo.id}
                  onToggleEdit={() =>
                    setExpandedId((cur) => (cur === promo.id ? null : promo.id))
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </HubFormSection>
    </div>
  );
}
