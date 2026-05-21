"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import {
  createHubBooking,
  type HubBookingActionState,
} from "@/app/actions/hub-bookings";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { Button } from "@/components/ui/button";
import { BOOKING_LOCATION_TYPES, BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import {
  ADDONS,
  DETAILER_NAMES,
  PACKAGES,
  VEHICLE_OPTIONS,
} from "@/lib/data";

const EMPTY: HubBookingActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export function BookingCreateForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createHubBooking, EMPTY);

  useEffect(() => {
    if (state.ok && state.bookingId) {
      router.push(`/hub/bookings/${state.bookingId}`);
    }
  }, [state.ok, state.bookingId, router]);

  return (
    <form action={action} className="space-y-10">
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
            <select name="package_key" required className={fieldClass} defaultValue="">
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
            <select name="vehicle_key" required className={fieldClass} defaultValue="">
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
            name="appointment_date"
            label="Date"
            disablePast
          />
          <label className="block">
            <span className={labelClass}>Time *</span>
            <select name="time" required className={fieldClass} defaultValue="">
              <option value="" disabled>
                Select time…
              </option>
              {BOOKING_TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Detailer *</span>
            <select name="detailer" required className={fieldClass} defaultValue="auto">
              <option value="auto">Auto-assign (next available)</option>
              {DETAILER_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Status *</span>
            <select name="status" className={fieldClass} defaultValue="confirmed">
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
            <select name="location" required className={fieldClass} defaultValue="">
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
            <input name="address" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>City</span>
            <input name="city" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>ZIP</span>
            <input name="zip" className={fieldClass} maxLength={10} />
          </label>
        </div>
      </section>

      <section className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Notes
        </h2>
        <div className="mt-5 grid gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="plastic_shine" value="Yes" />
            Plastic shine (customer wants shiny plastic)
          </label>
          <label className="block">
            <span className={labelClass}>Customer notes</span>
            <textarea
              name="customer_notes"
              rows={2}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Manager notes (internal)</span>
            <textarea name="manager_notes" rows={2} className={fieldClass} />
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

      {state.message && (
        <p
          className={`rounded-md border px-4 py-3 font-mono text-xs ${
            state.ok
              ? "border-y/30 bg-y/10 text-y"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
