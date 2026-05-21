"use client";

import { useActionState, useState } from "react";

import {
  createScheduleBlock,
  type HubBlockActionState,
} from "@/app/actions/hub-blocks";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { HubTimeRangeSelect } from "@/components/hub/hub-time-select";
import { Button } from "@/components/ui/button";

const EMPTY: HubBlockActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export function ScheduleBlockForm({
  staff,
}: {
  staff: { id: string; display_name: string }[];
}) {
  const [state, action, pending] = useActionState(createScheduleBlock, EMPTY);
  const [dateInput, setDateInput] = useState("");

  if (!staff.length) {
    return (
      <p className="rounded-md border border-white/10 p-4 font-mono text-xs text-text/45">
        No bookable staff in the database. Run{" "}
        <code className="text-y/70">npm run hub:seed</code> first.
      </p>
    );
  }

  return (
    <form action={action} className="rounded-md border border-white/10 p-6">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
        Block time
      </h2>
      <p className="mt-1 font-mono text-[9px] text-text/35">
        PTO, lunch, training, etc. · Central time
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelClass}>Team member *</span>
          <select name="staff_member_id" required className={fieldClass} defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.display_name}
              </option>
            ))}
          </select>
        </label>

        <HubDatePicker
          name="appointment_date"
          label="Date"
          disablePast
          onDateChange={setDateInput}
        />

        <label className="block">
          <span className={labelClass}>Reason *</span>
          <input
            name="reason"
            required
            placeholder="PTO, doctor appointment, lunch"
            className={fieldClass}
          />
        </label>

        <HubTimeRangeSelect
          dateInput={dateInput}
          startName="start_time"
          endName="end_time"
        />
      </div>

      <Button type="submit" className="mt-6" disabled={pending}>
        {pending ? "Saving…" : "Add block"}
      </Button>

      {state.message && (
        <p
          className={`mt-4 rounded-md border px-4 py-3 font-mono text-xs ${
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
