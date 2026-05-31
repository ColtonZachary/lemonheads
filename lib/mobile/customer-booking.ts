export const CUSTOMER_BOOKING_LIST_SELECT =
  "id, reference_id, service_name, vehicle_type, appointment_date, starts_at, ends_at, status, price_display, detailer_name";

export type CustomerBookingRow = {
  id: string;
  reference_id: string;
  service_name: string;
  vehicle_type: string;
  appointment_date: string;
  starts_at: string;
  ends_at: string;
  status: string;
  price_display: string | null;
  detailer_name: string | null;
};

export function serializeCustomerBooking(row: CustomerBookingRow) {
  return {
    id: row.id,
    referenceId: row.reference_id,
    serviceName: row.service_name,
    vehicleType: row.vehicle_type,
    appointmentDate: row.appointment_date,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    priceDisplay: row.price_display ?? "TBD",
    detailerName: row.detailer_name,
  };
}
