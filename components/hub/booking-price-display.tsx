import {
  getBookingPriceDisplay,
  type BookingPriceFields,
} from "@/lib/hub/booking-price-display";
import { cn } from "@/lib/utils";

export function BookingPriceDisplay({
  booking,
  className,
  stacked,
}: {
  booking: BookingPriceFields;
  className?: string;
  /** Stack original above final (better in narrow table cells). */
  stacked?: boolean;
}) {
  const { original, final, discountLabel } = getBookingPriceDisplay(booking);

  if (!original) {
    return (
      <span className={cn("font-mono text-sm text-foreground", className)}>{final}</span>
    );
  }

  return (
    <div
      className={cn(
        stacked ? "flex flex-col gap-0.5" : "flex flex-wrap items-baseline gap-x-2 gap-y-0.5",
        className,
      )}
    >
      <span className="font-mono text-xs text-muted-foreground line-through">{original}</span>
      <span className="font-mono text-sm text-primary">{final}</span>
      {discountLabel && (
        <span className="font-mono text-[9px] text-muted-foreground">−{discountLabel} promo</span>
      )}
    </div>
  );
}
