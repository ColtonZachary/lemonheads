export type EmployeeProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export type EmployeeMeResponse = {
  profile: EmployeeProfile;
  detailerName: string;
};

export type EmployeeJob = {
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
  priceDisplay: string;
  priceOriginal: string | null;
  priceDiscount: string | null;
  detailPhase: string;
};

export type EmployeeJobsResponse = {
  weekMonday: string;
  weekEnd: string;
  weekLabel: string;
  detailerName: string;
  jobs: EmployeeJob[];
};

export type BookingJobPhoto = {
  id: string;
  phase: "before" | "after";
  url: string;
  createdAt: string;
};

export type EmployeeJobDetail = {
  id: string;
  referenceId: string;
  customerName: string;
  email: string;
  phone: string;
  locationType: string;
  addressLine: string;
  city: string;
  zip: string;
  serviceName: string;
  serviceKey: string | null;
  vehicleType: string;
  vehicleInfo: string;
  addons: string[];
  plasticShine: boolean;
  earlyContactOk: boolean;
  customerNotes: string;
  status: string;
  appointmentDate: string;
  startsAt: string;
  endsAt: string;
  detailerName: string | null;
  detailerAutoAssigned: boolean;
  cardOnFile: boolean;
  billedAt: string | null;
  priceDisplay: string;
  priceOriginal: string | null;
  priceDiscount: string | null;
  detailPhase: string;
  detailEnRouteAt: string | null;
  detailArrivedAt: string | null;
  detailFinishedAt: string | null;
  detailChecklistCompletedAt: string | null;
};

export type EmployeeJobDetailResponse = {
  job: EmployeeJobDetail;
  photos: BookingJobPhoto[];
  beforePhotoCount: number;
  afterPhotoCount: number;
};

export type ChecklistItem = {
  id: string;
  label: string;
  sortOrder: number;
};

export type EmployeePayResponse = {
  weekMonday: string;
  weekEnd: string;
  weekLabel: string;
  detailerName: string;
  tierLabel: string;
  isSenior: boolean;
  week: {
    jobCount: number;
    packagePayCents: number;
    addonPayCents: number;
    totalPayCents: number;
    totalPayDisplay: string;
    jobs: {
      appointmentDate: string;
      serviceName: string;
      totalPayCents: number;
      totalPayDisplay: string;
    }[];
  };
};
