"use server";

import { z } from "zod";

import {
  BookingSchema,
  type BookingInput,
  type BookingState,
} from "@/lib/booking-types";
import {
  renderBookingConfirmationToCustomer,
  renderBookingEmail,
  type BookingEmailData,
} from "@/lib/email-templates";
import { insertBooking } from "@/lib/bookings/insert-booking";
import { FROM_EMAIL, TO_EMAIL, getResend } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function submitBooking(
  input: BookingInput,
): Promise<BookingState> {
  const parsed = BookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please double-check your booking details.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;
  let assignedDetailer = data.requestedDetailer?.trim() || "Auto-Assigned";

  const emailPayload: BookingEmailData = {
    customerName: data.customerName,
    email: data.email,
    phone: data.phone,
    service: data.service,
    vehicle: data.vehicle,
    vehicleInfo: data.vehicleInfo,
    date: data.date,
    time: data.time,
    location: data.location,
    address: data.address,
    city: data.city,
    zip: data.zip,
    requestedDetailer: assignedDetailer,
    addons: data.addons,
    estimatedTotal: data.estimatedTotal,
    plasticCondition: data.plasticCondition,
    earlyContact: data.earlyContact,
    notes: data.notes,
    cardOnFile: data.cardOnFile,
  };

  const resend = getResend();
  const bookingId = `LH-${Date.now().toString(36).toUpperCase()}`;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const saved = await insertBooking(supabase, bookingId, data);
    if (!saved.ok) {
      return {
        status: "error",
        message: saved.error,
      };
    }
    assignedDetailer = saved.detailerName;
    emailPayload.requestedDetailer = saved.detailerName;
  } else {
    console.warn(
      "[booking] SUPABASE_SERVICE_ROLE_KEY not set — booking not stored in database",
    );
  }

  try {
    if (!resend) {
      // No API key configured — log so dev can see the payload
      console.log("[booking] would send →", emailPayload);
      return {
        status: "success",
        bookingId,
        assignedDetailer,
      };
    }

    // Notify the shop
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: data.email,
      subject: `New booking · ${data.service} · ${data.customerName}`,
      html: renderBookingEmail(emailPayload),
    });

    // Confirm to the customer
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `You're booked with Lemonhead's — ${data.date} at ${data.time}`,
      html: renderBookingConfirmationToCustomer(emailPayload),
    });

    return {
      status: "success",
      bookingId,
      assignedDetailer,
    };
  } catch (err) {
    console.error("[booking] resend error", err);
    return {
      status: "error",
      message:
        "We couldn't reach our email system. Please call us at 833-536-6648 to book.",
    };
  }
}
