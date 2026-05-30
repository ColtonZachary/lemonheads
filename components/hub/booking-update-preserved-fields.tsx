import type { HubBookingDetail } from "@/components/hub/booking-detail-form";

export type BookingEditSection =
  | "customer"
  | "service"
  | "location"
  | "schedule"
  | "pricing"
  | "notes";

function Hidden({ name, value }: { name: string; value: string }) {
  return <input type="hidden" name={name} value={value} />;
}

/** Carry unchanged booking fields when saving from a section dialog. */
export function BookingUpdatePreservedFields({
  booking,
  omit,
  packageKey,
  vehicleKey,
  dateInput,
  timeLabel,
  overrideDollars,
  promoCode,
  isBilled,
}: {
  booking: HubBookingDetail;
  omit: BookingEditSection;
  packageKey: string;
  vehicleKey: string;
  dateInput: string;
  timeLabel: string;
  overrideDollars: string;
  promoCode: string;
  isBilled: boolean;
}) {
  const detailer =
    booking.detailer_auto_assigned ? "auto" : (booking.detailer_name ?? "auto");

  return (
    <>
      {omit !== "customer" && (
        <>
          <Hidden name="customer_name" value={booking.customer_name} />
          <Hidden name="email" value={booking.email} />
          <Hidden name="phone" value={booking.phone} />
        </>
      )}
      {omit !== "service" && (
        <>
          <Hidden name="package_key" value={packageKey} />
          <Hidden name="vehicle_key" value={vehicleKey} />
          <Hidden name="vehicle_info" value={booking.vehicle_info} />
          {booking.addons.map((a) => (
            <input key={a} type="hidden" name="addons" value={a} />
          ))}
          {booking.plastic_shine ? (
            <Hidden name="plastic_shine" value="Yes" />
          ) : null}
        </>
      )}
      {omit !== "location" && (
        <>
          <Hidden name="location" value={booking.location_type} />
          <Hidden name="address" value={booking.address_line} />
          <Hidden name="city" value={booking.city} />
          <Hidden name="zip" value={booking.zip} />
          <Hidden name="customer_notes" value={booking.customer_notes} />
        </>
      )}
      {omit !== "schedule" && (
        <>
          <Hidden name="appointment_date" value={dateInput} />
          <Hidden name="time" value={timeLabel} />
          <Hidden name="detailer" value={detailer} />
          <Hidden name="status" value={booking.status} />
        </>
      )}
      {omit !== "pricing" && (
        <>
          <Hidden name="promo_code" value={promoCode} />
          <Hidden name="price_override" value={overrideDollars} />
          {isBilled ? <Hidden name="billed" value="on" /> : null}
        </>
      )}
      {omit !== "notes" && (
        <Hidden name="manager_notes" value={booking.manager_notes} />
      )}
    </>
  );
}
