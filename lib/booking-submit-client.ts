import { BookingSchema, type BookingInput, type BookingState } from "@/lib/booking-types";

/** Client-side booking submit for static hosting (GitHub Pages). */
export async function submitBookingClient(
  input: BookingInput,
): Promise<BookingState> {
  const parsed = BookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please double-check your booking details.",
    };
  }

  const bookingId = `LH-${Date.now().toString(36).toUpperCase()}`;
  const d = parsed.data;
  const lines = [
    `Booking ID: ${bookingId}`,
    `Name: ${d.customerName}`,
    `Email: ${d.email}`,
    `Phone: ${d.phone}`,
    `Service: ${d.service}`,
    `Vehicle: ${d.vehicle}`,
    `When: ${d.date} at ${d.time}`,
    `Location: ${d.location}`,
    `Address: ${[d.address, d.city, d.zip].filter(Boolean).join(", ")}`,
    `Detailer: ${d.requestedDetailer || "No preference"}`,
    `Add-ons: ${d.addons?.length ? d.addons.join(", ") : "None"}`,
    `Estimated: ${d.estimatedTotal}`,
    `Notes: ${d.notes || "—"}`,
  ];

  const mailto = `mailto:info@lemonheadsdetail.com?subject=${encodeURIComponent(
    `Booking request ${bookingId}`,
  )}&body=${encodeURIComponent(lines.join("\n"))}`;

  if (typeof window !== "undefined") {
    window.open(mailto, "_blank", "noopener,noreferrer");
  }

  return {
    status: "success",
    bookingId,
  };
}
