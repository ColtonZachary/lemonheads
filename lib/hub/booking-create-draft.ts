export type HubBookingCreateDraft = {
  customer_name: string;
  phone: string;
  email: string;
  package_key: string;
  vehicle_key: string;
  vehicle_info: string;
  addons: string[];
  appointment_date: string;
  time: string;
  detailer: string;
  status: string;
  location: string;
  address: string;
  city: string;
  zip: string;
  plastic_shine: boolean;
  customer_notes: string;
  manager_notes: string;
};

export const EMPTY_BOOKING_CREATE_DRAFT: HubBookingCreateDraft = {
  customer_name: "",
  phone: "",
  email: "",
  package_key: "",
  vehicle_key: "",
  vehicle_info: "",
  addons: [],
  appointment_date: "",
  time: "",
  detailer: "auto",
  status: "confirmed",
  location: "",
  address: "",
  city: "",
  zip: "",
  plastic_shine: false,
  customer_notes: "",
  manager_notes: "",
};

export function parseHubBookingCreateDraft(formData: FormData): HubBookingCreateDraft {
  return {
    customer_name: String(formData.get("customer_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    package_key: String(formData.get("package_key") ?? ""),
    vehicle_key: String(formData.get("vehicle_key") ?? ""),
    vehicle_info: String(formData.get("vehicle_info") ?? ""),
    addons: formData.getAll("addons").map(String),
    appointment_date: String(formData.get("appointment_date") ?? ""),
    time: String(formData.get("time") ?? ""),
    detailer: String(formData.get("detailer") ?? "auto") || "auto",
    status: String(formData.get("status") ?? "confirmed"),
    location: String(formData.get("location") ?? ""),
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    zip: String(formData.get("zip") ?? ""),
    plastic_shine: String(formData.get("plastic_shine") ?? "") === "Yes",
    customer_notes: String(formData.get("customer_notes") ?? ""),
    manager_notes: String(formData.get("manager_notes") ?? ""),
  };
}
