"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BookingCreateForm } from "@/components/hub/booking-create-form";
import { WeekCalendar } from "@/components/hub/week-calendar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import type { HubBookingCreateDraft } from "@/lib/hub/booking-create-draft";
import { UNASSIGNED_DETAILER } from "@/lib/hub/week-calendar";
import type {
  WeekCalendarBooking,
  WeekCalendarDetailer,
  WeekDayColumn,
} from "@/lib/hub/week-calendar";
import { cn } from "@/lib/utils";

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
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    if (searchParams.get("book") === "1") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("book");
      const q = params.toString();
      router.replace(q ? `/hub/calendar?${q}` : "/hub/calendar", { scroll: false });
    }
  }, [router, searchParams]);

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
    <div
      className={cn(
        "mt-10 flex flex-col gap-6 lg:flex-row lg:items-start",
        panelOpen && canBook && "lg:gap-4",
      )}
    >
      <div className="min-w-0 flex-1">
        {createdBookingId && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-y/30 bg-y/10 px-4 py-3">
            <p className="font-mono text-xs text-y">Booking created.</p>
            <div className="flex gap-2">
              <Link
                href={`/hub/bookings/${createdBookingId}`}
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-y hover:underline"
              >
                Open booking
              </Link>
              <button
                type="button"
                onClick={() => setCreatedBookingId(null)}
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-text/40 hover:text-text"
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

        <p className="mt-6 font-mono text-[10px] text-text/30">
          Showing {bookingCount} job{bookingCount === 1 ? "" : "s"} this week
        </p>
      </div>

      {canBook && panelOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            aria-label="Close booking panel"
            onClick={closeBook}
          />

          <aside
            className={cn(
              "fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-white/10 bg-dk shadow-[-12px_0_48px_rgba(0,0,0,0.45)]",
              "lg:static lg:z-auto lg:max-h-[calc(100svh-5rem)] lg:w-[min(100%,420px)] lg:shrink-0 lg:shadow-none",
              "lg:sticky lg:top-6",
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div>
                <h2 className="font-display text-2xl tracking-[0.04em] text-y">
                  NEW BOOKING
                </h2>
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
                  Calendar stays visible
                </p>
              </div>
              <button
                type="button"
                onClick={closeBook}
                className="flex h-9 w-9 items-center justify-center rounded border border-white/15 text-text/60 transition-colors hover:border-y/30 hover:text-y"
                aria-label="Close"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <BookingCreateForm
                detailerNames={detailerNames}
                initialDraft={bookDraft}
                formSeed={formSeed}
                onSuccess={handleCreated}
                onCancel={closeBook}
                compact
              />
            </div>
          </aside>
        </>
      )}

      {canBook && !panelOpen && (
        <div className="lg:hidden">
          <Button type="button" className="w-full" onClick={() => openBook()}>
            New booking <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
