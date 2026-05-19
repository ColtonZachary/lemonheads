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
import { FROM_EMAIL, TO_EMAIL, getResend } from "@/lib/resend";

export type { BookingInput, BookingState };

export async function submitBooking(input: BookingInput): Promise<BookingState> {
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
    requestedDetailer: data.requestedDetailer,
    addons: data.addons,
    estimatedTotal: data.estimatedTotal,
    plasticCondition: data.plasticCondition,
    earlyContact: data.earlyContact,
    notes: data.notes,
    cardOnFile: data.cardOnFile,
  };

  const resend = getResend();
  const bookingId = `LH-${Date.now().toString(36).toUpperCase()}`;

  try {
    if (!resend) {
      // No API key configured — log so dev can see the payload
      console.log("[booking] would send →", emailPayload);
      return { status: "success", bookingId };
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

    return { status: "success", bookingId };
  } catch (err) {
    console.error("[booking] resend error", err);
    return {
      status: "error",
      message:
        "We couldn't reach our email system. Please call us at 833-536-6648 to book.",
    };
  }
}
