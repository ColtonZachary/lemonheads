import type { DetailerAvailabilitySnapshot } from "@/lib/bookings/detailer-availability";

/** Static hosting: availability checks run only on Vercel/local server. */
export async function getDetailerAvailability(
  _dateLabel: string,
  _durationHours: number,
): Promise<DetailerAvailabilitySnapshot> {
  return {
    fullyBookedSlots: [],
    busySlotsByDetailer: {},
  };
}
