"use server";

import { revalidatePath } from "next/cache";

import { getProfile, isManagerRole, type Profile } from "@/lib/auth/profile";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import {
  isPastDateInput,
  validateBlockScheduleFromInput,
} from "@/lib/bookings/scheduling-limits";
import { blockWindowFromForm } from "@/lib/hub/block-schedule";
import { dateInputsInRange } from "@/lib/hub/date-range";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HubBlockActionState = {
  ok: boolean;
  message: string;
};

type ManagerContext =
  | {
      supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
      profile: Profile;
    }
  | { error: string };

async function requireManagerSupabase(): Promise<ManagerContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const profile = await getProfile(supabase, user.id);
  if (!profile || !isManagerRole(profile.role)) {
    return { error: "Managers only." };
  }

  return { supabase, profile };
}

const ALL_DAY_START = BOOKING_TIME_SLOTS[0];
const ALL_DAY_END = BOOKING_TIME_SLOTS[BOOKING_TIME_SLOTS.length - 1];

export async function createScheduleBlock(
  _prev: HubBlockActionState,
  formData: FormData,
): Promise<HubBlockActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { supabase, profile } = ctx;

  const staffMemberId = String(formData.get("staff_member_id") ?? "");
  const blockMode = String(formData.get("block_mode") ?? "single");
  const startDate = String(formData.get("appointment_date") ?? "");
  const endDate = String(formData.get("appointment_date_end") ?? "");
  const allDay = String(formData.get("all_day") ?? "") === "on";
  let startTime = String(formData.get("start_time") ?? "");
  let endTime = String(formData.get("end_time") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!staffMemberId) {
    return { ok: false, message: "Select a team member." };
  }
  if (!reason) {
    return { ok: false, message: "Reason is required (e.g. PTO, lunch, training)." };
  }

  if (allDay) {
    startTime = ALL_DAY_START;
    endTime = ALL_DAY_END;
  }

  if (
    !BOOKING_TIME_SLOTS.includes(startTime as (typeof BOOKING_TIME_SLOTS)[number]) ||
    !BOOKING_TIME_SLOTS.includes(endTime as (typeof BOOKING_TIME_SLOTS)[number])
  ) {
    return { ok: false, message: "Invalid time slot." };
  }

  const dateList =
    blockMode === "range"
      ? (() => {
          if (!endDate) {
            return { error: "Select an end date for the range." } as const;
          }
          return dateInputsInRange(startDate, endDate);
        })()
      : { dates: [startDate] };

  if ("error" in dateList) {
    return { ok: false, message: dateList.error };
  }

  if (!dateList.dates.length) {
    return { ok: false, message: "Select at least one date." };
  }

  if (isPastDateInput(dateList.dates[0]!)) {
    return { ok: false, message: "Start date cannot be in the past." };
  }

  const rows: {
    staff_member_id: string;
    starts_at: string;
    ends_at: string;
    reason: string;
    created_by: string;
  }[] = [];

  for (const dateInput of dateList.dates) {
    const scheduleError = validateBlockScheduleFromInput(
      dateInput,
      startTime,
      endTime,
    );
    if (scheduleError) {
      return {
        ok: false,
        message: `${scheduleError} (day ${dateInput})`,
      };
    }

    const window = blockWindowFromForm(dateInput, startTime, endTime);
    if ("error" in window) {
      return { ok: false, message: window.error };
    }

    rows.push({
      staff_member_id: staffMemberId,
      starts_at: window.startsAt,
      ends_at: window.endsAt,
      reason,
      created_by: profile.id,
    });
  }

  const { error } = await supabase.from("schedule_blocks").insert(rows);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/hub/blocks");
  revalidatePath("/hub/calendar");

  const count = rows.length;
  return {
    ok: true,
    message:
      count === 1
        ? "Block added to the calendar."
        : `${count} days blocked on the calendar.`,
  };
}

export async function deleteScheduleBlock(
  blockId: string,
  _prev: HubBlockActionState,
  _formData: FormData,
): Promise<HubBlockActionState> {
  void _formData;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { error } = await ctx.supabase
    .from("schedule_blocks")
    .delete()
    .eq("id", blockId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/hub/blocks");
  revalidatePath("/hub/calendar");

  return { ok: true, message: "Block removed." };
}
