import type { Metadata } from "next";
import { Suspense } from "react";

import { BookingFlow } from "@/components/book/booking-flow";
import { SectionLabel } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Book a Detail",
  description:
    "Book a Lemonhead's mobile detail in under 2 minutes. Pick your package, vehicle, time, and we'll come to you.",
};

export default function BookPage() {
  return (
    <>
      <header className="px-[5%] pb-12 pt-20 text-center">
        <SectionLabel centered>Schedule Your Detail</SectionLabel>
        <h1 className="mt-4 font-display text-[clamp(52px,8vw,96px)] leading-[0.95] tracking-[0.02em]">
          BOOK A <span className="text-y">DETAIL</span>
        </h1>
        <p className="mt-3.5 font-mono text-[13px] tracking-[0.08em] text-text/40">
          Takes less than 2 minutes. No account needed.
        </p>
      </header>

      <div className="mx-auto max-w-[820px] px-[5%] pb-24">
        <Suspense fallback={<BookingFallback />}>
          <BookingFlow />
        </Suspense>
      </div>
    </>
  );
}

function BookingFallback() {
  return (
    <div className="rounded-lg border border-border-faint bg-card p-10 text-center font-mono text-xs tracking-[0.08em] text-muted">
      Loading booking…
    </div>
  );
}
