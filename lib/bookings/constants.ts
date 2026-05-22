/** Time slots shown in the booking calendar (must match UI labels). */
export const BOOKING_TIME_SLOTS = [
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
] as const;

export type BookingTimeSlot = (typeof BOOKING_TIME_SLOTS)[number];

export const BOOKING_LOCATION_TYPES = [
  "Come to my home",
  "Come to my office / workplace",
  "Drop off at your Edmond location",
] as const;

export const BLOCKING_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
] as const;
