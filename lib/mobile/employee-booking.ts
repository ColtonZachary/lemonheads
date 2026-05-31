import { getBookingPriceDisplay } from "@/lib/hub/booking-price-display";

export const EMPLOYEE_JOB_LIST_SELECT =
  "id, reference_id, customer_name, phone, service_name, vehicle_type, detailer_name, appointment_date, starts_at, ends_at, status, city, address_line, location_type, zip, addons, price_display, estimated_price_cents, discount_cents, final_price_cents, price_override_cents, price_cents, detail_phase";

export const EMPLOYEE_JOB_DETAIL_SELECT = `
  id, reference_id, customer_name, email, phone,
  location_type, address_line, city, zip,
  service_name, service_key, vehicle_type, vehicle_info,
  addons, plastic_shine, early_contact_ok, customer_notes,
  status, appointment_date, starts_at, ends_at,
  detailer_name, detailer_auto_assigned,
  price_display, price_cents, price_override_cents,
  estimated_price_cents, discount_cents, final_price_cents,
  card_on_file, billed_at,
  detail_phase, detail_en_route_at, detail_arrived_at,
  detail_finished_at, detail_checklist_completed_at
`;

export type EmployeeBookingRow = {
  id: string;
  reference_id: string;
  customer_name: string;
  phone: string;
  service_name: string;
  vehicle_type: string;
  detailer_name: string | null;
  appointment_date: string;
  starts_at: string;
  ends_at: string;
  status: string;
  city: string;
  address_line: string;
  location_type: string;
  zip: string;
  addons: string[];
  price_display?: string;
  estimated_price_cents?: number | null;
  discount_cents?: number | null;
  final_price_cents?: number | null;
  price_override_cents?: number | null;
  price_cents?: number | null;
  detail_phase?: string | null;
};

export type EmployeeBookingDetailRow = EmployeeBookingRow & {
  email: string;
  service_key: string | null;
  vehicle_info: string;
  plastic_shine: boolean;
  early_contact_ok: boolean;
  customer_notes: string;
  detailer_auto_assigned: boolean;
  price_display: string;
  price_cents: number | null;
  price_override_cents: number | null;
  estimated_price_cents: number | null;
  discount_cents: number | null;
  final_price_cents: number | null;
  card_on_file: boolean;
  billed_at: string | null;
  detail_phase: string;
  detail_en_route_at: string | null;
  detail_arrived_at: string | null;
  detail_finished_at: string | null;
  detail_checklist_completed_at: string | null;
};

export function formatEmployeeJobPrice(row: {
  price_display?: string;
  estimated_price_cents?: number | null;
  discount_cents?: number | null;
  final_price_cents?: number | null;
  price_override_cents?: number | null;
  price_cents?: number | null;
}): { display: string; original: string | null; discountLabel: string | null } {
  const { original, final, discountLabel } = getBookingPriceDisplay({
    estimated_price_cents: row.estimated_price_cents ?? row.price_cents ?? null,
    discount_cents: row.discount_cents ?? null,
    final_price_cents: row.final_price_cents ?? null,
    price_override_cents: row.price_override_cents ?? null,
    price_display: row.price_display,
  });
  return { display: final, original, discountLabel };
}

export function serializeEmployeeJobList(row: EmployeeBookingRow) {
  const price = formatEmployeeJobPrice(row);
  return {
    ...row,
    addons: Array.isArray(row.addons) ? row.addons : [],
    priceDisplay: price.display,
    priceOriginal: price.original,
    priceDiscount: price.discountLabel,
    detailPhase: row.detail_phase ?? "awaiting_start",
  };
}

export function serializeEmployeeJobDetail(row: EmployeeBookingDetailRow) {
  const price = formatEmployeeJobPrice(row);
  return {
    id: row.id,
    referenceId: row.reference_id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    locationType: row.location_type,
    addressLine: row.address_line,
    city: row.city,
    zip: row.zip,
    serviceName: row.service_name,
    serviceKey: row.service_key,
    vehicleType: row.vehicle_type,
    vehicleInfo: row.vehicle_info,
    addons: Array.isArray(row.addons) ? row.addons : [],
    plasticShine: row.plastic_shine,
    earlyContactOk: row.early_contact_ok,
    customerNotes: row.customer_notes,
    status: row.status,
    appointmentDate: row.appointment_date,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    detailerName: row.detailer_name,
    detailerAutoAssigned: row.detailer_auto_assigned,
    cardOnFile: row.card_on_file,
    billedAt: row.billed_at,
    priceDisplay: price.display,
    priceOriginal: price.original,
    priceDiscount: price.discountLabel,
    detailPhase: row.detail_phase ?? "awaiting_start",
    detailEnRouteAt: row.detail_en_route_at,
    detailArrivedAt: row.detail_arrived_at,
    detailFinishedAt: row.detail_finished_at,
    detailChecklistCompletedAt: row.detail_checklist_completed_at,
  };
}
