import type { SupabaseClient } from "@supabase/supabase-js";

export type DetailerJobAssignedPushData = {
  detailerName: string;
  bookingId: string;
  referenceId: string;
  customerName: string;
  service: string;
  date: string;
  time: string;
};

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
  sound?: "default";
};

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

export type PushNotifyResult = { ok: true; sent: number } | { ok: false; error: string };

async function fetchProfileIdForDetailerName(
  client: SupabaseClient,
  detailerName: string,
): Promise<string | null> {
  const name = detailerName.trim();
  if (!name) return null;

  const { data, error } = await client
    .from("staff_members")
    .select("profile_id")
    .eq("display_name", name)
    .eq("active", true)
    .not("profile_id", "is", null)
    .maybeSingle();

  if (error) {
    console.error("[push] staff lookup:", error.message);
    return null;
  }

  return (data?.profile_id as string | null) ?? null;
}

async function fetchPushTokensForProfile(
  client: SupabaseClient,
  profileId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("employee_push_tokens")
    .select("expo_push_token")
    .eq("profile_id", profileId);

  if (error) {
    console.error("[push] token lookup:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => row.expo_push_token as string)
    .filter((token) => token.startsWith("ExponentPushToken["));
}

async function recordPushEvent(
  client: SupabaseClient | null,
  args: {
    eventType: string;
    recipient: string;
    payload: Record<string, unknown>;
    sentAt?: string;
    error?: string;
  },
): Promise<void> {
  if (!client) {
    console.log("[push] event", args);
    return;
  }

  const { error } = await client.from("notification_events").insert({
    channel: "push",
    event_type: args.eventType,
    recipient: args.recipient,
    payload: args.payload,
    sent_at: args.sentAt ?? null,
    error: args.error ?? null,
  });

  if (error) {
    console.error("[push] record event:", error.message);
  }
}

function renderJobAssignedPush(data: DetailerJobAssignedPushData): {
  title: string;
  body: string;
} {
  return {
    title: "New job assigned",
    body: `${data.customerName} · ${data.service} on ${data.date} at ${data.time} (${data.referenceId})`,
  };
}

async function sendExpoPushMessages(
  messages: ExpoPushMessage[],
): Promise<{ sent: number; errors: string[] }> {
  if (!messages.length) return { sent: 0, errors: [] };

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      sent: 0,
      errors: [`Expo push API failed (${res.status})${text ? `: ${text}` : ""}`],
    };
  }

  const tickets = (await res.json()) as { data?: ExpoPushTicket[] };
  const errors: string[] = [];
  let sent = 0;

  for (const ticket of tickets.data ?? []) {
    if (ticket.status === "ok") {
      sent += 1;
    } else {
      errors.push(ticket.message ?? ticket.details?.error ?? "Unknown push error");
    }
  }

  return { sent, errors };
}

/** Notify a detailer that a job was assigned or reassigned to them. */
export async function notifyDetailerJobAssigned(
  client: SupabaseClient | null,
  data: DetailerJobAssignedPushData,
): Promise<PushNotifyResult> {
  const detailerName = data.detailerName.trim();
  if (!detailerName) {
    return { ok: false, error: "No detailer assigned." };
  }

  if (!client) {
    console.log("[push] job assigned (no admin client)", data);
    return { ok: true, sent: 0 };
  }

  const profileId = await fetchProfileIdForDetailerName(client, detailerName);
  if (!profileId) {
    return { ok: false, error: `No hub profile linked for detailer ${detailerName}.` };
  }

  const tokens = await fetchPushTokensForProfile(client, profileId);
  if (!tokens.length) {
    await recordPushEvent(client, {
      eventType: "detailer.job_assigned",
      recipient: profileId,
      payload: {
        reference_id: data.referenceId,
        booking_id: data.bookingId,
        detailer_name: detailerName,
        skipped: "no_push_tokens",
      },
    });
    return { ok: true, sent: 0 };
  }

  const copy = renderJobAssignedPush(data);
  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title: copy.title,
    body: copy.body,
    sound: "default",
    data: {
      type: "job_assigned",
      bookingId: data.bookingId,
      referenceId: data.referenceId,
    },
  }));

  const { sent, errors } = await sendExpoPushMessages(messages);

  await recordPushEvent(client, {
    eventType: "detailer.job_assigned",
    recipient: profileId,
    payload: {
      reference_id: data.referenceId,
      booking_id: data.bookingId,
      detailer_name: detailerName,
      token_count: tokens.length,
      sent,
      errors: errors.length ? errors : undefined,
    },
    sentAt: sent > 0 ? new Date().toISOString() : undefined,
    error: errors[0],
  });

  if (sent === 0 && errors.length) {
    return { ok: false, error: errors[0] ?? "Push delivery failed." };
  }

  return { ok: true, sent };
}
