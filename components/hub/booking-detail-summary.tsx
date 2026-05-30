import { BookingLoyaltyRewardRemove } from "@/components/hub/booking-loyalty-reward-remove";
import { BookingPriceDisplay } from "@/components/hub/booking-price-display";
import type { HubBookingDetail } from "@/components/hub/booking-detail-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BookingDetailSummary({
  booking,
}: {
  booking: HubBookingDetail;
}) {
  const isDeleted = Boolean(booking.deleted_at);
  const promoCode = Array.isArray(booking.promo_codes)
    ? booking.promo_codes[0]?.code
    : booking.promo_codes?.code;
  const loyaltyRedemption = Array.isArray(booking.loyalty_redemptions)
    ? booking.loyalty_redemptions[0]
    : booking.loyalty_redemptions;
  const loyaltyGoal = loyaltyRedemption?.loyalty_reward_goals;
  const loyaltyTitle = Array.isArray(loyaltyGoal)
    ? loyaltyGoal[0]?.title
    : loyaltyGoal?.title;
  const hasActiveReward =
    Boolean(booking.loyalty_redemption_id) &&
    loyaltyRedemption?.status !== "cancelled";

  const detailerLabel = booking.detailer_auto_assigned
    ? "Auto-assign"
    : booking.detailer_name ?? "—";

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/80 bg-card/40 lg:col-span-1">
        <CardHeader className="pb-1">
          <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="font-display text-2xl tracking-wide text-foreground">
            <BookingPriceDisplay booking={booking} />
          </div>
          {promoCode && (booking.discount_cents ?? 0) > 0 ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              Promo: <span className="text-primary">{promoCode}</span>
            </p>
          ) : null}
          {booking.price_override_cents != null ? (
            <p className="font-mono text-[9px] text-muted-foreground">
              Manager override applied
            </p>
          ) : null}
          {booking.plastic_shine ? (
            <Badge variant="outline" className="font-mono text-[9px]">
              Plastic shine
            </Badge>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-1">
          <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
            Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5 pt-0">
          <p className="font-medium leading-snug">{booking.customer_name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {booking.email}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{booking.phone}</p>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-1">
          <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
            Service
          </CardTitle>
          <CardDescription className="font-mono text-[10px]">
            {detailerLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0.5 pt-0">
          <p className="leading-snug">{booking.service_name}</p>
          <p className="text-sm text-muted-foreground">
            {booking.vehicle_type}
            {booking.vehicle_info ? ` · ${booking.vehicle_info}` : ""}
          </p>
          {booking.addons.length > 0 ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              {booking.addons.join(", ")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40 md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-1">
          <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5 pt-0">
          <p className="text-sm leading-snug">
            {booking.location_type}
            {booking.address_line ? ` — ${booking.address_line}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {[booking.city, booking.zip].filter(Boolean).join(", ") || "—"}
          </p>
          {booking.customer_notes ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              Note: {booking.customer_notes}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {hasActiveReward && loyaltyTitle ? (
        <Card className="border-primary/25 bg-primary/5 md:col-span-2 lg:col-span-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
                Rewards applied
              </p>
              <p className="text-sm">{loyaltyTitle}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {loyaltyRedemption?.points_spent} points
              </p>
            </div>
            {!isDeleted ? (
              <BookingLoyaltyRewardRemove bookingId={booking.id} />
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
