"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BookingCreateForm } from "@/components/hub/booking-create-form";
import { WeekCalendar } from "@/components/hub/week-calendar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { HubBookingCreateDraft } from "@/lib/hub/booking-create-draft";
import { UNASSIGNED_DETAILER } from "@/lib/hub/week-calendar";
import type {
  WeekCalendarBooking,
  WeekCalendarDetailer,
  WeekDayColumn,
} from "@/lib/hub/week-calendar";

export function CalendarPageClient({
  weekMonday,
  weekLabel,
  days,
  detailers,
  bookings,
  bookingCount,
  canManage,
  canBook,
  detailerNames,
  initialBookOpen,
  clearBookQueryParam,
}: {
  weekMonday: string;
  weekLabel: string;
  days: WeekDayColumn[];
  detailers: WeekCalendarDetailer[];
  bookings: WeekCalendarBooking[];
  bookingCount: number;
  canManage: boolean;
  canBook: boolean;
  detailerNames: string[];
  initialBookOpen?: boolean;
  /** True when URL had ?book=1 so we can strip it on close without useSearchParams */
  clearBookQueryParam?: boolean;
}) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(initialBookOpen ?? false);
  const [bookDraft, setBookDraft] = useState<Partial<HubBookingCreateDraft>>({});
  const [formSeed, setFormSeed] = useState(0);

  const openBook = useCallback((prefill?: Partial<HubBookingCreateDraft>) => {
    setBookDraft(prefill ?? {});
    setFormSeed((n) => n + 1);
    setPanelOpen(true);
  }, []);

  const closeBook = useCallback(() => {
    setPanelOpen(false);
    if (clearBookQueryParam) {
      queueMicrotask(() => {
        const params = new URLSearchParams(window.location.search);
        params.delete("book");
        const q = params.toString();
        router.replace(q ? `/hub/calendar?${q}` : "/hub/calendar", { scroll: false });
      });
    }
  }, [router, clearBookQueryParam]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBook();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, closeBook]);

  const handleBookSlot = (dateKey: string, detailerName: string) => {
    const prefill: Partial<HubBookingCreateDraft> = {
      appointment_date: dateKey,
    };
    if (detailerName !== UNASSIGNED_DETAILER) {
      prefill.detailer = detailerName;
    }
    openBook(prefill);
  };

  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const handleCreated = (bookingId: string) => {
    setCreatedBookingId(bookingId);
    setPanelOpen(false);
    setBookDraft({});
    router.refresh();
  };

  return (
    <div className="mt-6 min-w-0">
      {createdBookingId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/10 px-4 py-3">
          <p className="font-mono text-xs text-primary">Booking created.</p>
          <div className="flex gap-2">
            <Link
              href={`/hub/bookings/${createdBookingId}`}
              className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary hover:underline"
            >
              Open booking
            </Link>
            <button
              type="button"
              onClick={() => setCreatedBookingId(null)}
              className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <WeekCalendar
        weekMonday={weekMonday}
        weekLabel={weekLabel}
        days={days}
        detailers={detailers}
        bookings={bookings}
        canManage={canManage}
        canBook={canBook}
        onOpenBook={() => openBook()}
        onBookDay={(dateKey) => openBook({ appointment_date: dateKey })}
        onBookSlot={handleBookSlot}
      />

      <p className="mt-6 font-mono text-[10px] text-muted-foreground">
        Showing {bookingCount} job{bookingCount === 1 ? "" : "s"} this week
      </p>

      {canBook && !panelOpen && (
        <div className="mt-6 lg:hidden">
          <Button type="button" className="w-full" onClick={() => openBook()}>
            New booking <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {canBook && panelOpen && (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) closeBook();
          }}
        >
          <SheetContent
            side="right"
            className="flex w-full max-w-[100vw] flex-col gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-[420px] focus:outline-none"
          >
            <SheetHeader className="shrink-0 space-y-0.5 border-b border-border px-4 py-4 pr-12">
              <SheetTitle className="font-display text-2xl font-normal tracking-[0.04em] text-primary">
                NEW BOOKING
              </SheetTitle>
              <SheetDescription className="font-mono text-[9px] uppercase tracking-[0.1em]">
                Step-by-step — calendar stays visible
              </SheetDescription>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-2">
              <BookingCreateForm
                detailerNames={detailerNames}
                initialDraft={bookDraft}
                formSeed={formSeed}
                onSuccess={handleCreated}
                onCancel={closeBook}
                compact
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
