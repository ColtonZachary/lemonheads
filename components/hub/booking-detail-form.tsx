"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import {
  cancelHubBooking,
  deleteHubBookingForm,
  updateHubBooking,
  type HubBookingActionState,
} from "@/app/actions/hub-bookings";
import { Button } from "@/components/ui/button";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import { DETAILER_NAMES } from "@/lib/data";
import { centralScheduleLabels } from "@/lib/hub/schedule-labels";

const EMPTY: HubBookingActionState = { ok: false, message: "" };

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type HubBookingDetail = {
  id: string;
  reference_id: string;
  customer_name: string;
  email: string;
  phone: string;
  location_type: string;
  address_line: string;
  city: string;
  zip: string;
  service_name: string;
  vehicle_type: string;
  vehicle_info: string;
  addons: string[];
  plastic_shine: boolean;
  customer_notes: string;
  status: string;
  starts_at: string;
  ends_at: string;
  detailer_name: string | null;
  detailer_auto_assigned: boolean;
  price_display: string;
  price_cents: number | null;
  price_override_cents: number | null;
  final_price_cents: number | null;
  manager_notes: string;
  cancellation_reason: string;
  cancelled_at: string | null;
  deleted_at: string | null;
};

function ActionBanner({ state }: { state: HubBookingActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={`mt-4 rounded-md border px-4 py-3 font-mono text-xs ${
        state.ok
          ? "border-y/30 bg-y/10 text-y"
          : "border-red-500/30 bg-red-500/10 text-red-200"
      }`}
    >
      {state.message}
    </p>
  );
}

export function BookingDetailForm({ booking }: { booking: HubBookingDetail }) {
  const router = useRouter();
  const labels = centralScheduleLabels(booking.starts_at);
  const overrideDollars =
    booking.price_override_cents != null
      ? String(booking.price_override_cents / 100)
      : "";

  const [updateState, updateAction, updatePending] = useActionState(
    updateHubBooking.bind(null, booking.id),
    EMPTY,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelHubBooking.bind(null, booking.id),
    EMPTY,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteHubBookingForm.bind(null, booking.id),
    EMPTY,
  );

  useEffect(() => {
    if (deleteState.ok) router.push("/hub/bookings");
  }, [deleteState.ok, router]);

  const isDeleted = Boolean(booking.deleted_at);
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-md border border-white/10 bg-card2/40 p-5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Customer
          </h2>
          <p className="mt-3 text-lg">{booking.customer_name}</p>
          <p className="font-mono text-xs text-text/50">{booking.email}</p>
          <p className="font-mono text-xs text-text/50">{booking.phone}</p>
        </section>
        <section className="rounded-md border border-white/10 bg-card2/40 p-5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Service & vehicle
          </h2>
          <p className="mt-3">{booking.service_name}</p>
          <p className="text-sm text-text/60">
            {booking.vehicle_type}
            {booking.vehicle_info ? ` · ${booking.vehicle_info}` : ""}
          </p>
          {booking.addons.length > 0 && (
            <p className="mt-2 font-mono text-[10px] text-text/40">
              Add-ons: {booking.addons.join(", ")}
            </p>
          )}
        </section>
        <section className="rounded-md border border-white/10 bg-card2/40 p-5 md:col-span-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Location
          </h2>
          <p className="mt-3">
            {booking.location_type}
            {booking.address_line ? ` — ${booking.address_line}` : ""}
          </p>
          <p className="text-sm text-text/50">
            {[booking.city, booking.zip].filter(Boolean).join(", ") || "—"}
          </p>
          {booking.customer_notes && (
            <p className="mt-3 text-sm text-text/60">
              Customer notes: {booking.customer_notes}
            </p>
          )}
        </section>
      </div>

      {!isDeleted && (
        <form action={updateAction} className="rounded-md border border-white/10 p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
            Edit booking
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
                Status
              </span>
              <select
                name="status"
                defaultValue={booking.status}
                className="mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
                Detailer
              </span>
              <select
                name="detailer"
                defaultValue={
                  booking.detailer_auto_assigned ? "auto" : (booking.detailer_name ?? "auto")
                }
                className="mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm"
              >
                <option value="auto">Auto-assign (next available)</option>
                {DETAILER_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
                Date (Central)
              </span>
              <input
                type="date"
                name="appointment_date"
                defaultValue={labels.dateInput}
                className="mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm"
              />
            </label>

            <label className="block">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
                Time (Central)
              </span>
              <select
                name="time"
                defaultValue={labels.timeLabel}
                className="mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm"
              >
                {BOOKING_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
                Price override ($)
              </span>
              <input
                type="text"
                name="price_override"
                placeholder={booking.price_display || "e.g. 209"}
                defaultValue={overrideDollars}
                className="mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm"
              />
              <span className="mt-1 block font-mono text-[9px] text-text/30">
                Leave blank to keep current estimate
              </span>
            </label>

            <label className="block sm:col-span-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
                Manager notes
              </span>
              <textarea
                name="manager_notes"
                rows={3}
                defaultValue={booking.manager_notes}
                className="mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" disabled={updatePending}>
              {updatePending ? "Saving…" : "Save changes"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/hub/bookings">Back to list</Link>
            </Button>
          </div>
          <ActionBanner state={updateState} />
        </form>
      )}

      {!isDeleted && !isCancelled && (
        <form action={cancelAction} className="rounded-md border border-red-500/20 p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-300/80">
            Cancel booking
          </h2>
          <label className="mt-4 block">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
              Reason (required)
            </span>
            <input
              type="text"
              name="cancellation_reason"
              required
              placeholder="Customer requested reschedule"
              className="mt-1 w-full max-w-lg rounded border border-white/15 bg-dk px-3 py-2 text-sm"
            />
          </label>
          <Button
            type="submit"
            variant="outline"
            className="mt-4 border-red-500/40 text-red-200 hover:border-red-400"
            disabled={cancelPending}
          >
            {cancelPending ? "Cancelling…" : "Cancel booking"}
          </Button>
          <ActionBanner state={cancelState} />
        </form>
      )}

      {booking.cancellation_reason && (
        <p className="font-mono text-xs text-text/45">
          Cancellation reason: {booking.cancellation_reason}
        </p>
      )}

      {!isDeleted && (
        <form action={deleteAction} className="rounded-md border border-white/10 p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-text/40">
            Delete booking
          </h2>
          <p className="mt-2 max-w-xl text-sm text-text/50">
            Soft-deletes this booking (hidden from calendar). Audit log is kept.
          </p>
          <Button
            type="submit"
            variant="outline"
            className="mt-4"
            disabled={deletePending}
            onClick={(e) => {
              if (!confirm("Delete this booking? This cannot be undone from the hub.")) {
                e.preventDefault();
              }
            }}
          >
            {deletePending ? "Deleting…" : "Delete booking"}
          </Button>
          <ActionBanner state={deleteState} />
        </form>
      )}

      {isDeleted && (
        <p className="rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 font-mono text-xs text-text/50">
          This booking was deleted. Edits are disabled.
        </p>
      )}
    </div>
  );
}
