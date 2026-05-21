export type BookingPriceFields = {
  estimated_price_cents: number | null;
  discount_cents?: number | null;
  final_price_cents: number | null;
  price_display?: string;
  price_override_cents?: number | null;
};

export function formatHubPriceCents(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toFixed(0)}`
    : `$${dollars.toFixed(2)}`;
}

export function getBookingPriceDisplay(fields: BookingPriceFields): {
  original: string | null;
  final: string;
  discountLabel: string | null;
} {
  const finalCents =
    fields.price_override_cents ?? fields.final_price_cents ?? null;
  const estimated = fields.estimated_price_cents;
  const discount = fields.discount_cents ?? 0;

  if (finalCents != null) {
    const final = formatHubPriceCents(finalCents);
    if (estimated != null && discount > 0 && estimated > finalCents) {
      return {
        original: formatHubPriceCents(estimated),
        final,
        discountLabel: formatHubPriceCents(discount),
      };
    }
    return { original: null, final, discountLabel: null };
  }

  if (fields.price_display?.trim()) {
    return { original: null, final: fields.price_display.trim(), discountLabel: null };
  }

  return { original: null, final: "—", discountLabel: null };
}
