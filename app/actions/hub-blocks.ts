"use server";

import { revalidatePath } from "next/cache";

import { getProfile, isManagerRole, type Profile } from "@/lib/auth/profile";
import { validateBlockScheduleFromInput } from "@/lib/bookings/scheduling-limits";
import { blockWindowFromForm } from "@/lib/hub/block-schedule";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
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

export async function createScheduleBlock(
  _prev: HubBlockActionState,
  formData: FormData,
): Promise<HubBlockActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { supabase, profile } = ctx;

  const staffMemberId = String(formData.get("staff_member_id") ?? "");
  const dateInput = String(formData.get("appointment_date") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!staffMemberId) {
    return { ok: false, message: "Select a team member." };
  }
  if (!reason) {
    return { ok: false, message: "Reason is required (e.g. PTO, lunch, training)." };
  }

  if (
    !BOOKING_TIME_SLOTS.includes(startTime as (typeof BOOKING_TIME_SLOTS)[number]) ||
    !BOOKING_TIME_SLOTS.includes(endTime as (typeof BOOKING_TIME_SLOTS)[number])
  ) {
    return { ok: false, message: "Invalid time slot." };
  }

  const scheduleError = validateBlockScheduleFromInput(
    dateInput,
    startTime,
    endTime,
  );
  if (scheduleError) {
    return { ok: false, message: scheduleError };
  }

  const window = blockWindowFromForm(dateInput, startTime, endTime);
  if ("error" in window) {
    return { ok: false, message: window.error };
  }

  const { error } = await supabase.from("schedule_blocks").insert({
    staff_member_id: staffMemberId,
    starts_at: window.startsAt,
    ends_at: window.endsAt,
    reason,
    created_by: profile.id,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/hub/blocks");
  revalidatePath("/hub/calendar");

  return { ok: true, message: "Block added to the calendar." };
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
