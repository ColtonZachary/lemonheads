export type CustomerMeResponse = {
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    pointsBalance: number;
  };
};

export type CatalogPackage = {
  key: string;
  name: string;
  prices: Record<string, number>;
  durationHours: number;
  description: string;
  features: string[];
  featured?: boolean;
};

export type CatalogResponse = {
  catalog: {
    packages: CatalogPackage[];
    addons: { name: string; price: number; description: string }[];
    locationTypes: string[];
    packageAddonBlocks: Record<string, string[]>;
  };
};

export type CustomerBooking = {
  id: string;
  referenceId: string;
  serviceName: string;
  vehicleType: string;
  appointmentDate: string;
  startsAt: string;
  endsAt: string;
  status: string;
  priceDisplay: string;
  detailerName: string | null;
};

export type CustomerBookingsResponse = {
  bookings: CustomerBooking[];
};

export type VehicleOption = {
  key: string;
  label: string;
  sub?: string;
};

export type BookingConfigResponse = {
  catalog: CatalogResponse["catalog"];
  vehicles: VehicleOption[];
  timeSlots: string[];
  schedulingRules: {
    sameDayCutoffHour: number;
    sameDayCutoffEnabled: boolean;
    globalBlackoutDates: string[];
    areaBlackouts: { date: string; serviceAreaSlug: string }[];
  };
  detailers: { name: string; photo?: string }[];
};

export type BookableDate = {
  dateInput: string;
  label: string;
};

export type BookingDatesResponse = {
  dates: BookableDate[];
};

export type SlotState = {
  slot: string;
  selectable: boolean;
  reason: "past" | "cutoff" | "ok";
};

export type BookingAvailabilityResponse = {
  timeSlots: string[];
  slotStates: SlotState[];
  fullyBookedSlots: string[];
  busySlotsByDetailer: Record<string, string[]>;
};

export type BookingPreviewResponse = {
  subtotalCents: number;
  promoDiscountCents: number;
  loyaltyDiscountCents?: number;
  discountCents: number;
  totalCents: number;
  promoCode: string | null;
  packageName: string;
  totalDisplay: string;
};

export type CheckoutRewardOption = {
  kind: "pending" | "goal";
  id: string;
  redemptionId?: string;
  goalId: string;
  label: string;
  detail: string;
  pointsRequired: number;
  discountCents: number;
  applicable: boolean;
  addAddonAtCheckout: boolean;
  rewardAddonName: string | null;
  reason?: string;
};

export type RewardsCheckoutResponse = {
  email: string;
  pointsBalance: number;
  options: CheckoutRewardOption[];
};

export type LoyaltyApplyResponse = {
  redemptionId: string;
  label: string;
  discountCents: number;
  subtotalCents: number;
  totalCents: number;
  totalDisplay: string;
};

export type BookingSubmitResponse = {
  bookingId: string;
  assignedDetailer?: string;
};

export type CustomerVehicle = {
  id: string;
  vehicleKey: string;
  vehicleLabel: string;
  vehicleInfo: string;
  nickname: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerVehiclesResponse = {
  vehicles: CustomerVehicle[];
};

export type CustomerAddress = {
  id: string;
  locationType: string;
  address: string;
  city: string;
  zip: string;
  nickname: string;
  isDefault: boolean;
  formattedAddress: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAddressesResponse = {
  addresses: CustomerAddress[];
};
