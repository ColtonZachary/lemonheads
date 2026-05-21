import { centralDateKey } from "@/lib/bookings/scheduling-limits";
import { formatCentralDate, formatCentralTime } from "@/lib/hub/format";

export type ScheduleBlockRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string;
  staff_member_id: string;
  staff_members: { display_name: string } | null;
};

export type BlockDateGroup = {
  dateKey: string;
  dateLabel: string;
  blocks: ScheduleBlockRow[];
};

export function groupBlocksByDate(
  rows: ScheduleBlockRow[],
  detailerOrder: readonly string[],
): BlockDateGroup[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  const byDate = new Map<string, ScheduleBlockRow[]>();
  for (const row of sorted) {
    const key = centralDateKey(row.starts_at);
    const list = byDate.get(key) ?? [];
    list.push(row);
    byDate.set(key, list);
  }

  return [...byDate.keys()].sort().map((dateKey) => {
    const dayBlocks = byDate.get(dateKey)!;
    dayBlocks.sort((a, b) => {
      const nameA = a.staff_members?.display_name ?? "";
      const nameB = b.staff_members?.display_name ?? "";
      const orderA = detailerOrder.indexOf(nameA);
      const orderB = detailerOrder.indexOf(nameB);
      const idxA = orderA >= 0 ? orderA : detailerOrder.length;
      const idxB = orderB >= 0 ? orderB : detailerOrder.length;
      if (idxA !== idxB) return idxA - idxB;
      return (
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
    });

    const sample = dayBlocks[0]!.starts_at;
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      weekday: "long",
    }).format(new Date(sample));

    return {
      dateKey,
      dateLabel: `${weekday}, ${formatCentralDate(sample)}`,
      blocks: dayBlocks,
    };
  });
}

export function formatBlockTimeRange(row: ScheduleBlockRow): string {
  return `${formatCentralTime(row.starts_at)} – ${formatCentralTime(row.ends_at)}`;
}
