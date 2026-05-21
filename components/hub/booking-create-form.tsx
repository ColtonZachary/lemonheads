"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import {
  createHubBooking,
  type HubBookingActionState,
} from "@/app/actions/hub-bookings";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { HubTimeSelect } from "@/components/hub/hub-time-select";
import { Button } from "@/components/ui/button";
import { BOOKING_LOCATION_TYPES } from "@/lib/bookings/constants";
import { ADDONS, PACKAGES, VEHICLE_OPTIONS } from "@/lib/data";
import { EMPTY_BOOKING_CREATE_DRAFT } from "@/lib/hub/booking-create-draft";

const EMPTY: HubBookingActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export function BookingCreateForm({
  detailerNames,
}: {
  detailerNames: string[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createHubBooking, EMPTY);
  const errorRef = useRef<HTMLDivElement>(null);

  const draft = state.draft ?? EMPTY_BOOKING_CREATE_DRAFT;
  const [dateInput, setDateInput] = useState(draft.appointment_date);
  const [time, setTime] = useState(draft.time);

  const formKey = useMemo(
    () =>
      state.draft
        ? `restore-${state.draft.appointment_date}-${state.draft.time}-${state.draft.customer_name}-${state.draft.package_key}`
        : "new",
    [state.draft],
  );

  useEffect(() => {
    if (state.ok && state.bookingId) {
      router.push(`/hub/bookings/${state.bookingId}`);
    }
  }, [state.ok, state.bookingId, router]);

  useEffect(() => {
    if (!state.ok && state.draft) {
      setDateInput(state.draft.appointment_date);
      setTime(state.draft.time);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state]);

  return (
    <form key={formKey} action={action} className="space-y-10">
      {!state.ok && state.message && (
        <div
          ref={errorRef}
          className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3"
          role="alert"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-red-200/90">
            Could not create booking
          </p>
          <p className="mt-1 font-mono text-sm text-red-100">{state.message}</p>
          <p className="mt-2 text-sm text-text/45">
            Your entries are kept below — fix the issue and submit again.
          </p>
        </div>
      )}

      <section className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Customer
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Name *</span>
            <input
              name="customer_name"
              required
              className={fieldClass}
              placeholder="Jane Smith"
              defaultValue={draft.customer_name}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Phone *</span>
            <input
              name="phone"
              type="tel"
              required
              className={fieldClass}
              placeholder="405-555-0100"
              defaultValue={draft.phone}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Email *</span>
            <input
              name="email"
              type="email"
              required
              className={fieldClass}
              placeholder="jane@example.com"
              defaultValue={draft.email}
            />
          </label>
        </div>
      </section>

      <section className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Service
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Package *</span>
            <select
              name="package_key"
              required
              className={fieldClass}
              defaultValue={draft.package_key || undefined}
            >
              <option value="" disabled>
                Select package…
              </option>
              {PACKAGES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Vehicle *</span>
            <select
              name="vehicle_key"
              required
              className={fieldClass}
              defaultValue={draft.vehicle_key || undefined}
            >
              <option value="" disabled>
                Select vehicle…
              </option>
              {VEHICLE_OPTIONS.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Vehicle notes</span>
            <input
              name="vehicle_info"
              className={fieldClass}
              placeholder="Color, year, fleet unit #"
              defaultValue={draft.vehicle_info}
            />
          </label>
        </div>

        <fieldset className="mt-6">
          <legend className={labelClass}>Add-ons (optional)</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ADDONS.map((a) => (
              <label
                key={a.name}
                className="flex cursor-pointer items-start gap-2 rounded border border-white/10 px-3 py-2 text-sm hover:border-white/20"
              >
                <input
                  type="checkbox"
                  name="addons"
                  value={a.name}
                  className="mt-1"
                  defaultChecked={draft.addons.includes(a.name)}
                />
                <span>
                  {a.name}
                  <span className="ml-1 font-mono text-[10px] text-y/70">
                    +${a.price}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Schedule (Central)
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <HubDatePicker
            key={`date-${formKey}`}
            name="appointment_date"
            label="Date"
            disablePast
            defaultValue={draft.appointment_date}
            onDateChange={setDateInput}
          />
          <HubTimeSelect
            key={`time-${formKey}`}
            dateInput={dateInput}
            name="time"
            label="Time"
            value={time}
            onValueChange={setTime}
          />
          <label className="block">
            <span className={labelClass}>Detailer *</span>
            <select
              name="detailer"
              required
              className={fieldClass}
              defaultValue={draft.detailer || "auto"}
            >
              <option value="auto">Auto-assign (next available)</option>
              {detailerNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Status *</span>
            <select name="status" className={fieldClass} defaultValue={draft.status}>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="in_progress">in_progress</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Location
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Location type *</span>
            <select
              name="location"
              required
              className={fieldClass}
              defaultValue={draft.location || undefined}
            >
              <option value="" disabled>
                Select…
              </option>
              {BOOKING_LOCATION_TYPES.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Street address</span>
            <input name="address" className={fieldClass} defaultValue={draft.address} />
          </label>
          <label className="block">
            <span className={labelClass}>City</span>
            <input name="city" className={fieldClass} defaultValue={draft.city} />
          </label>
          <label className="block">
            <span className={labelClass}>ZIP</span>
            <input
              name="zip"
              className={fieldClass}
              maxLength={10}
              defaultValue={draft.zip}
            />
          </label>
        </div>
      </section>

      <section className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Notes
        </h2>
        <div className="mt-5 grid gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="plastic_shine"
              value="Yes"
              defaultChecked={draft.plastic_shine}
            />
            Plastic shine (customer wants shiny plastic)
          </label>
          <label className="block">
            <span className={labelClass}>Customer notes</span>
            <textarea
              name="customer_notes"
              rows={2}
              className={fieldClass}
              defaultValue={draft.customer_notes}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Manager notes (internal)</span>
            <textarea
              name="manager_notes"
              rows={2}
              className={fieldClass}
              defaultValue={draft.manager_notes}
            />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create booking"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/hub/bookings">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
