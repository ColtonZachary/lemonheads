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
import { notifyCustomerBookingCreated } from "@/lib/notifications/customer-sms";
import { notifyDetailerJobAssigned } from "@/lib/notifications/employee-push";
import { FROM_EMAIL, TO_EMAIL, getResend } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function submitPublicBooking(
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
  let savedBookingId: string | undefined;
  if (supabase) {
    const saved = await insertBooking(supabase, bookingId, data);
    if (!saved.ok) {
      return {
        status: "error",
        message: saved.error,
      };
    }
    assignedDetailer = saved.detailerName;
    savedBookingId = saved.bookingId;
    emailPayload.requestedDetailer = saved.detailerName;
  } else {
    console.warn(
      "[booking] SUPABASE_SERVICE_ROLE_KEY not set — booking not stored in database",
    );
  }

  try {
    if (!resend) {
      console.log("[booking] would send →", emailPayload);
      void notifyCustomerBookingCreated(supabase, {
        phone: data.phone,
        customerName: data.customerName,
        service: data.service,
        date: data.date,
        time: data.time,
        referenceId: bookingId,
        detailerName: assignedDetailer,
        bookingId: savedBookingId,
      }).then((sms) => {
        if (!sms.ok) console.warn("[booking] customer SMS:", sms.error);
      });
      if (savedBookingId) {
        void notifyDetailerJobAssigned(supabase, {
          detailerName: assignedDetailer,
          bookingId: savedBookingId,
          referenceId: bookingId,
          customerName: data.customerName,
          service: data.service,
          date: data.date,
          time: data.time,
        }).then((push) => {
          if (!push.ok) console.warn("[booking] detailer push:", push.error);
        });
      }
      return {
        status: "success",
        bookingId,
        assignedDetailer,
      };
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: data.email,
      subject: `New booking · ${data.service} · ${data.customerName}`,
      html: renderBookingEmail(emailPayload),
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `You're booked with Lemonhead's — ${data.date} at ${data.time}`,
      html: renderBookingConfirmationToCustomer(emailPayload),
    });

    void notifyCustomerBookingCreated(supabase, {
      phone: data.phone,
      customerName: data.customerName,
      service: data.service,
      date: data.date,
      time: data.time,
      referenceId: bookingId,
      detailerName: assignedDetailer,
      bookingId: savedBookingId,
    }).then((sms) => {
      if (!sms.ok) console.warn("[booking] customer SMS:", sms.error);
    });
    if (savedBookingId) {
      void notifyDetailerJobAssigned(supabase, {
        detailerName: assignedDetailer,
        bookingId: savedBookingId,
        referenceId: bookingId,
        customerName: data.customerName,
        service: data.service,
        date: data.date,
        time: data.time,
      }).then((push) => {
        if (!push.ok) console.warn("[booking] detailer push:", push.error);
      });
    }

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
