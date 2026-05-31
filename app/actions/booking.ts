"use server";

import type { BookingInput, BookingState } from "@/lib/booking-types";
import { submitPublicBooking } from "@/lib/bookings/submit-public-booking";

export async function submitBooking(
  input: BookingInput,
): Promise<BookingState> {
  return submitPublicBooking(input);
}
