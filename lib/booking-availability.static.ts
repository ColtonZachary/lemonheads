import type { DetailerAvailabilitySnapshot } from "@/lib/bookings/detailer-availability";

/** Static hosting: availability checks run only on Vercel/local server. */
export async function getDetailerAvailability(
  _dateLabel: string,
  _durationHours: number,
  _packageKey?: string,
): Promise<DetailerAvailabilitySnapshot> {
  return {
    fullyBookedSlots: [],
    busySlotsByDetailer: {},
  };
}
