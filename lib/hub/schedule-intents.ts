export type ScheduleIntent = "time_off" | "weekly" | "exception";

export type TimeOffShape = "single" | "range" | "custom";

export const SCHEDULE_INTENTS: {
  id: ScheduleIntent;
  title: string;
  description: string;
  example: string;
  accent: string;
}[] = [
  {
    id: "time_off",
    title: "Time off or busy",
    description: "Block bookings on specific dates — PTO, vacation, training, lunch.",
    example: "Jay is on vacation March 10–14",
    accent: "border-red-500/25 bg-red-500/5 hover:border-red-500/40",
  },
  {
    id: "weekly",
    title: "Regular days off",
    description: "Days they never work, repeating every week.",
    example: "Sam does not work Saturdays or Sundays",
    accent: "border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40",
  },
  {
    id: "exception",
    title: "Working an off day",
    description: "Let them take bookings on one date even if their weekly schedule says off.",
    example: "Alex wants to work this Saturday only",
    accent: "border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/40",
  },
];

export const TIME_OFF_SHAPES: { id: TimeOffShape; label: string; hint: string }[] = [
  { id: "single", label: "One day", hint: "Single PTO or appointment" },
  { id: "range", label: "Date range", hint: "Consecutive days off" },
  { id: "custom", label: "Pick days", hint: "Scattered days on the calendar" },
];

export function intentToBlockMode(
  intent: ScheduleIntent,
  timeOffShape: TimeOffShape,
): "single" | "range" | "custom" | "weekly" | "open_day" {
  if (intent === "weekly") return "weekly";
  if (intent === "exception") return "open_day";
  return timeOffShape;
}
