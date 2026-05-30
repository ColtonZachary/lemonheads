import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import type { DetailerAvailabilitySnapshot } from "@/lib/bookings/detailer-availability";
import { isTimeSlotSelectableForDateInput } from "@/lib/bookings/scheduling-limits";
import {
  HubFieldRow,
  HubFormField,
  HubInput,
  HubNativeSelect,
} from "@/components/hub/hub-form";
import { HubFormSection } from "@/components/hub/hub-form";
import { HubEmptyState } from "@/components/hub/hub-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS = [1.5, 2, 2.5, 3, 3.5, 4.5] as const;

export { DURATION_OPTIONS };

export function BookingsAvailabilityForm({
  viewDate,
  durationHours,
}: {
  viewDate: string;
  durationHours: number;
}) {
  return (
    <HubFormSection title="Check availability">
      <form action="/hub/bookings" method="get" className="space-y-4">
        <HubFieldRow>
          <HubFormField label="Date (Central)" htmlFor="avail-date">
            <HubInput
              id="avail-date"
              type="date"
              name="date"
              required
              defaultValue={viewDate}
              className="hub-date-input"
            />
          </HubFormField>
          <HubFormField label="Job length (hours)" htmlFor="avail-duration">
            <HubNativeSelect
              id="avail-duration"
              name="duration"
              defaultValue={String(durationHours)}
            >
              {DURATION_OPTIONS.map((h) => (
                <option key={h} value={String(h)}>
                  {h}h
                </option>
              ))}
            </HubNativeSelect>
          </HubFormField>
        </HubFieldRow>
        <Button type="submit" size="sm">
          View availability
        </Button>
        <p className="font-mono text-[9px] text-muted-foreground">
          Same rules as public booking: existing jobs, detailer blocks, and weekly patterns.
        </p>
      </form>
    </HubFormSection>
  );
}

export function BookingsDayAvailabilityMatrix({
  viewDate,
  dateLabel,
  durationHours,
  detailerNames,
  availability,
}: {
  viewDate: string;
  dateLabel: string;
  durationHours: number;
  detailerNames: string[];
  availability: DetailerAvailabilitySnapshot;
}) {
  if (!detailerNames.length) {
    return (
      <HubEmptyState className="mt-4">
        No bookable detailers on the roster. Add active detailers under Staff.
      </HubEmptyState>
    );
  }

  return (
    <Card className="mt-6 overflow-hidden border-border/80">
      <CardHeader className="border-b border-border bg-muted/30">
        <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          Availability — {dateLabel}
        </CardTitle>
        <p className="font-mono text-[9px] text-muted-foreground">
          Assuming a {durationHours}h job · Central Time
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-[520px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 font-mono text-[9px] uppercase">Time</TableHead>
              {detailerNames.map((name) => (
                <TableHead
                  key={name}
                  className="px-3 text-center font-mono text-[9px] uppercase"
                >
                  {name.split(" ")[0]}
                </TableHead>
              ))}
              <TableHead className="px-4 text-center font-mono text-[9px] uppercase">
                Overall
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BOOKING_TIME_SLOTS.map((slot) => {
              const selectable = isTimeSlotSelectableForDateInput(viewDate, slot);
              const fullyBooked = availability.fullyBookedSlots.includes(slot);
              return (
                <TableRow key={slot}>
                  <TableCell className="px-4 font-mono text-xs whitespace-nowrap">
                    {slot}
                  </TableCell>
                  {detailerNames.map((name) => {
                    const busy =
                      availability.busySlotsByDetailer[name]?.includes(slot) ?? false;
                    return (
                      <TableCell key={name} className="px-3 text-center">
                        <SlotBadge
                          variant={
                            !selectable ? "closed" : busy ? "busy" : "open"
                          }
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell className="px-4 text-center">
                    <SlotBadge
                      variant={
                        !selectable ? "closed" : fullyBooked ? "full" : "open"
                      }
                      label={
                        !selectable ? "Closed" : fullyBooked ? "Full" : "Open"
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="flex flex-wrap gap-4 border-t border-border px-4 py-3 font-mono text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <SlotBadge variant="open" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <SlotBadge variant="busy" /> Booked / blocked
          </span>
          <span className="flex items-center gap-1.5">
            <SlotBadge variant="full" /> All detailers busy
          </span>
          <span className="flex items-center gap-1.5">
            <SlotBadge variant="closed" /> Past or cutoff
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SlotBadge({
  variant,
  label,
}: {
  variant: "open" | "busy" | "full" | "closed";
  label?: string;
}) {
  const text =
    label ??
    (variant === "open"
      ? "✓"
      : variant === "closed"
        ? "—"
        : "✗");

  return (
    <Badge
      variant={
        variant === "open"
          ? "default"
          : variant === "closed"
            ? "outline"
            : "destructive"
      }
      className={cn(
        "min-h-[22px] min-w-[22px] justify-center font-mono text-[9px] uppercase",
        variant === "open" && "bg-primary/15 text-primary hover:bg-primary/15",
        variant === "closed" && "text-muted-foreground",
      )}
      title={
        label ??
        (variant === "open"
          ? "Available"
          : variant === "busy"
            ? "Busy"
            : variant === "full"
              ? "Full"
              : "Closed")
      }
    >
      {text}
    </Badge>
  );
}
