import { z } from "zod";

export const BookingSchema = z.object({
  customerName: z.string().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email."),
  phone: z.string().min(7, "Please enter a phone number."),
  service: z.string().min(1, "Please select a service."),
  vehicleKey: z.string().optional().default(""),
  vehicle: z.string().min(1, "Please select a vehicle type."),
  promoCode: z.string().optional().default(""),
  vehicleInfo: z.string().optional().default(""),
  date: z.string().min(1, "Please pick a date."),
  time: z.string().min(1, "Please pick a time."),
  location: z.string().min(1, "Please choose a location type."),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  requestedDetailer: z.string().optional().default(""),
  /** Package key from booking flow (e.g. fully, quickie). */
  serviceKey: z.string().optional().default(""),
  /** Used to compute ends_at from starts_at. */
  durationHours: z.number().positive().optional().default(2),
  addons: z.array(z.string()).optional().default([]),
  estimatedTotal: z.string().optional().default("TBD"),
  /** Plastic conditioning — Yes = customer wants the shiny look. */
  plasticCondition: z.enum(["Yes", "No"]).default("No"),
  earlyContact: z.enum(["Yes", "No"]).default("Yes"),
  notes: z.string().optional().default(""),
  cardOnFile: z.boolean().optional().default(false),
});

export type BookingInput = z.infer<typeof BookingSchema>;

export type BookingState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; bookingId: string; assignedDetailer?: string };
