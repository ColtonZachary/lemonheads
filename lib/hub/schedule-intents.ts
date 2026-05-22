import type { IconName } from "@/components/ui/icons";

export type ScheduleIntent = "time_off" | "weekly" | "exception";

export type TimeOffShape = "single" | "range" | "custom";

export type RulesTab = "weekly" | "exceptions" | "blocked";

export const SCHEDULE_INTENTS: {
  id: ScheduleIntent;
  title: string;
  shortTitle: string;
  description: string;
  example: string;
  icon: IconName;
  accent: string;
  selectedRing: string;
  iconBg: string;
}[] = [
  {
    id: "time_off",
    title: "Time off or busy",
    shortTitle: "Time off",
    description: "Block bookings on specific dates — PTO, vacation, or partial-day busy.",
    example: "Vacation March 10–14",
    icon: "clock",
    accent: "border-red-500/20 bg-red-500/[0.04] hover:border-red-500/35 hover:bg-red-500/[0.07]",
    selectedRing: "ring-2 ring-red-400/50 border-red-500/40",
    iconBg: "bg-red-500/15 text-red-200",
  },
  {
    id: "weekly",
    title: "Regular days off",
    shortTitle: "Weekly",
    description: "Weekdays they never work — repeats every week.",
    example: "Off every Saturday & Sunday",
    icon: "menu",
    accent: "border-amber-500/20 bg-amber-500/[0.04] hover:border-amber-500/35 hover:bg-amber-500/[0.07]",
    selectedRing: "ring-2 ring-amber-400/50 border-amber-500/40",
    iconBg: "bg-amber-500/15 text-amber-200",
  },
  {
    id: "exception",
    title: "Working an off day",
    shortTitle: "Exception",
    description: "One date they can work even when their weekly schedule says off.",
    example: "Working this Saturday only",
    icon: "check",
    accent: "border-emerald-500/20 bg-emerald-500/[0.04] hover:border-emerald-500/35 hover:bg-emerald-500/[0.07]",
    selectedRing: "ring-2 ring-emerald-400/50 border-emerald-500/40",
    iconBg: "bg-emerald-500/15 text-emerald-200",
  },
];

export const RULES_TABS: {
  id: RulesTab;
  label: string;
  emptyHint: string;
}[] = [
  {
    id: "weekly",
    label: "Weekly off-days",
    emptyHint: "No repeating weekly days off yet.",
  },
  {
    id: "exceptions",
    label: "Extra work days",
    emptyHint: "No one-time work-day exceptions yet.",
  },
  {
    id: "blocked",
    label: "Blocked dates",
    emptyHint: "No PTO or blocked dates in the next few months.",
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
