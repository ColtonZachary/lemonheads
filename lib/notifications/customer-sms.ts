import type { SupabaseClient } from "@supabase/supabase-js";

import { SITE } from "@/lib/site";
import { normalizeSmsRecipient, sendTwilioSms } from "@/lib/twilio";

export type CustomerBookingSmsData = {
  phone: string;
  customerName: string;
  service: string;
  date: string;
  time: string;
  referenceId: string;
  detailerName: string;
  bookingId?: string;
};

export type SmsNotifyResult = { ok: true } | { ok: false; error: string };

function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "there";
}

function detailerLabel(name: string): string {
  const t = name.trim();
  return t && t !== "Auto-Assigned" ? t : "our team";
}

function renderCreatedSms(d: CustomerBookingSmsData): string {
  return (
    `Hi ${firstName(d.customerName)}! Lemonhead's booked you for ${d.service} ` +
    `on ${d.date} at ${d.time}. Detailer: ${detailerLabel(d.detailerName)}. ` +
    `Ref ${d.referenceId}. Questions? ${SITE.phone.main.display}`
  );
}

function renderConfirmedSms(d: CustomerBookingSmsData): string {
  return (
    `Lemonhead's: Your ${d.service} on ${d.date} at ${d.time} is confirmed. ` +
    `Detailer: ${detailerLabel(d.detailerName)}. Ref ${d.referenceId}. ` +
    `${SITE.phone.main.display}`
  );
}

function renderRescheduledSms(d: CustomerBookingSmsData): string {
  return (
    `Lemonhead's: Your appointment moved to ${d.date} at ${d.time}. ` +
    `Service: ${d.service}. Detailer: ${detailerLabel(d.detailerName)}. ` +
    `Ref ${d.referenceId}. ${SITE.phone.main.display}`
  );
}

function renderCancelledSms(d: CustomerBookingSmsData): string {
  return (
    `Lemonhead's: Your ${d.service} on ${d.date} at ${d.time} was cancelled. ` +
    `Ref ${d.referenceId}. To reschedule call ${SITE.phone.main.display}`
  );
}

async function recordSmsEvent(
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
    console.log("[sms] event", args);
    return;
  }

  const { error } = await client.from("notification_events").insert({
    channel: "sms",
    event_type: args.eventType,
    recipient: args.recipient,
    payload: args.payload,
    sent_at: args.sentAt ?? null,
    error: args.error ?? null,
  });

  if (error) {
    console.error("[sms] record event:", error.message);
  }
}

async function deliverCustomerSms(
  client: SupabaseClient | null,
  eventType: string,
  phone: string,
  body: string,
  payload: Record<string, unknown>,
): Promise<SmsNotifyResult> {
  const to = normalizeSmsRecipient(phone);
  if (!to) {
    const error = "Invalid customer phone number for SMS.";
    await recordSmsEvent(client, {
      eventType,
      recipient: phone,
      payload,
      error,
    });
    return { ok: false, error };
  }

  try {
    const { sid } = await sendTwilioSms(to, body);
    await recordSmsEvent(client, {
      eventType,
      recipient: to,
      payload: { ...payload, twilio_sid: sid },
      sentAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "SMS send failed.";
    console.error(`[sms] ${eventType}:`, error);
    await recordSmsEvent(client, {
      eventType,
      recipient: to,
      payload,
      error,
    });
    return { ok: false, error };
  }
}

export async function notifyCustomerBookingCreated(
  client: SupabaseClient | null,
  data: CustomerBookingSmsData,
): Promise<SmsNotifyResult> {
  return deliverCustomerSms(
    client,
    "booking.created",
    data.phone,
    renderCreatedSms(data),
    {
      reference_id: data.referenceId,
      booking_id: data.bookingId ?? null,
      template: "created",
    },
  );
}

export async function notifyCustomerBookingConfirmed(
  client: SupabaseClient | null,
  data: CustomerBookingSmsData,
): Promise<SmsNotifyResult> {
  return deliverCustomerSms(
    client,
    "booking.confirmed",
    data.phone,
    renderConfirmedSms(data),
    {
      reference_id: data.referenceId,
      booking_id: data.bookingId ?? null,
      template: "confirmed",
    },
  );
}

export async function notifyCustomerBookingRescheduled(
  client: SupabaseClient | null,
  data: CustomerBookingSmsData,
): Promise<SmsNotifyResult> {
  return deliverCustomerSms(
    client,
    "booking.rescheduled",
    data.phone,
    renderRescheduledSms(data),
    {
      reference_id: data.referenceId,
      booking_id: data.bookingId ?? null,
      template: "rescheduled",
    },
  );
}

export async function notifyCustomerBookingCancelled(
  client: SupabaseClient | null,
  data: CustomerBookingSmsData,
): Promise<SmsNotifyResult> {
  return deliverCustomerSms(
    client,
    "booking.cancelled",
    data.phone,
    renderCancelledSms(data),
    {
      reference_id: data.referenceId,
      booking_id: data.bookingId ?? null,
      template: "cancelled",
    },
  );
}
